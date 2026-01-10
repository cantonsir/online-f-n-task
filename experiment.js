function getUrlParam(name) {
  try {
    return jsPsych?.data?.getURLVariable?.(name) ?? null;
  } catch {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
}

function hasUrlFlag(name) {
  const v = getUrlParam(name);
  if (v === null) return false;
  if (v === '' || v === '1' || v.toLowerCase() === 'true') return true;
  return false;
}

// === Prolific + saving configuration ===
// 1) Put your Google Apps Script (or other) endpoint here.
// Leave null to disable server saving and only download locally.
const DATA_SUBMIT_URL = 'https://script.google.com/macros/s/AKfycbzQAkYMW6BQ24GqUkPeXqXpglNaCzmyhxCjY34ADFONUHVwwaiHf0ki7n3robQlFmYqQA/exec';

// 2) Put your Prolific completion code here.
// You can also provide it as a URL param: ?cc=XXXXXX
// const PROLIFIC_COMPLETION_CODE = 'C165LFSB';
const PROLIFIC_COMPLETION_CODE = null;

function prolificCompleteUrl(completionCode) {
  if (!completionCode) return null;
  return `https://app.prolific.com/submissions/complete?cc=${encodeURIComponent(completionCode)}`;
}

function isGoogleAppsScriptUrl(url) {
  return typeof url === 'string' && url.includes('script.google.com/macros/s/');
}

// Standard JSON POST (requires proper CORS headers from the server)
async function postJsonCors(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Save failed (${res.status}): ${text || res.statusText}`);
  }

  return await res.text().catch(() => '');
}

// Google Apps Script web apps typically don't include Access-Control-Allow-Origin.
// We send a "no-cors" request with a plain-text JSON body so the server can still parse it.
// Note: the browser cannot read the response (opaque), so we treat "request sent" as success.
async function postJsonNoCorsText(url, payload) {
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(payload)
  });
  return 'opaque_no_cors_request_sent';
}

async function runSaveSmokeTest() {
  const el = document.getElementById('jspsych-target');
  if (el) {
    el.innerHTML = `
      <div style="max-width:760px;margin:3rem auto;text-align:center;line-height:1.5;">
        <h2>Save Smoke Test</h2>
        <p>Posting a small test payload to your server…</p>
      </div>
    `;
  }

  if (!DATA_SUBMIT_URL) {
    if (el) {
      el.innerHTML = `
        <div style="max-width:760px;margin:3rem auto;text-align:center;line-height:1.5;">
          <h2>Save Smoke Test</h2>
          <p><strong>Error:</strong> DATA_SUBMIT_URL is not configured.</p>
        </div>
      `;
    }
    return;
  }

  const prolific_pid = getUrlParam('PROLIFIC_PID') || 'smoke_test_pid';
  const study_id = getUrlParam('STUDY_ID') || 'smoke_test_study';
  const session_id = getUrlParam('SESSION_ID') || `smoke_${Math.random().toString(16).slice(2)}`;
  const started_at = new Date().toISOString();

  const payload = {
    prolific_pid,
    study_id,
    session_id,
    started_at,
    finished_at: new Date().toISOString(),
    user_agent: navigator.userAgent,
    url: window.location.href,
    data_csv: 'trial_type,task,rt\nsmoke_test,save,0',
    data_json: [
      {
        trial_type: 'smoke_test',
        task: 'save',
        utc_start: started_at,
        utc_end: new Date().toISOString(),
        rt: 0
      }
    ]
  };

  try {
    const responseText = isGoogleAppsScriptUrl(DATA_SUBMIT_URL)
      ? await postJsonNoCorsText(DATA_SUBMIT_URL, payload)
      : await postJsonCors(DATA_SUBMIT_URL, payload);
    console.debug('[DEBUG] smoke test save ok:', responseText);
    if (el) {
      const isAppsScript = isGoogleAppsScriptUrl(DATA_SUBMIT_URL);
      el.innerHTML = `
        <div style="max-width:760px;margin:3rem auto;text-align:center;line-height:1.5;">
          <h2>Save Smoke Test</h2>
          <p><strong>${isAppsScript ? 'Request sent.' : 'Success.'}</strong> ${isAppsScript ? 'For Google Apps Script, the browser cannot confirm success (no-cors).' : 'The server responded OK.'}</p>
          <p>Check your Google Sheet for a new row and your Drive folder for a new <code>.json</code> file.</p>
          <p style="margin-top:.75rem; font-size:.95rem; opacity:.9;">
            If nothing appears, open Apps Script → <strong>Executions</strong> to see the error (common causes: missing authorization for Drive/Sheets, or you edited the script but didn’t <strong>Deploy → New deployment</strong> / redeploy).
          </p>
        </div>
      `;
    }
  } catch (err) {
    console.error('[ERROR] smoke test save failed', err);
    if (el) {
      el.innerHTML = `
        <div style="max-width:760px;margin:3rem auto;text-align:center;line-height:1.5;">
          <h2>Save Smoke Test</h2>
          <p><strong>Failed.</strong> Open DevTools → Console for details.</p>
          <p>${String(err?.message || err)}</p>
        </div>
      `;
    }
  }
}

async function saveAllDataToServer(jsPsychInstance) {
  if (!DATA_SUBMIT_URL) return { ok: false, skipped: true, message: 'DATA_SUBMIT_URL not configured' };

  const prolific_pid = jsPsychInstance.data.getURLVariable('PROLIFIC_PID') || null;
  const study_id = jsPsychInstance.data.getURLVariable('STUDY_ID') || null;
  const session_id = jsPsychInstance.data.getURLVariable('SESSION_ID') || null;
  const started_at = jsPsychInstance.data.get().first(1).values()?.[0]?.utc_start || null;
  const finished_at = new Date().toISOString();

  const payload = {
    prolific_pid,
    study_id,
    session_id,
    started_at,
    finished_at,
    user_agent: navigator.userAgent,
    url: window.location.href,
    data_csv: jsPsychInstance.data.get().csv(),
    data_json: jsPsychInstance.data.get().values()
  };

  if (isGoogleAppsScriptUrl(DATA_SUBMIT_URL)) {
    const serverResponse = await postJsonNoCorsText(DATA_SUBMIT_URL, payload);
    return { ok: true, skipped: false, message: serverResponse, note: 'Apps Script no-cors: verify by checking Sheet/Drive' };
  }

  const serverResponse = await postJsonCors(DATA_SUBMIT_URL, payload);
  return { ok: true, skipped: false, message: serverResponse };
}

function showSavingScreen(messageHtml) {
  const el = document.getElementById('jspsych-target');
  if (!el) return;
  el.innerHTML = `
    <div style="max-width:760px;margin:3rem auto;text-align:center;line-height:1.5;">
      <h2>Saving your responses</h2>
      <p>Please do not close this tab.</p>
      <div style="margin-top:1rem;opacity:.9;">${messageHtml || ''}</div>
    </div>
  `;
}

// Initialize jsPsych
const jsPsych = initJsPsych({
  display_element: 'jspsych-target',
  on_data_update: function (data) {
    // Debug: helps confirm rating trials are being written.
    if (data?.task === 'rating') {
      console.debug('[DEBUG] rating saved', {
        category: data.category,
        normalized_category: data.normalized_category,
        stimulus_label: data.stimulus_label,
        response: data.response,
        rating: data.rating,
        rt: data.rt
      });
    }
  },
  on_finish: async () => {
    const prolific_pid = jsPsych.data.getURLVariable('PROLIFIC_PID') || 'test_subject';
    const completionCode = getUrlParam('cc') || PROLIFIC_COMPLETION_CODE;
    const completionUrl = prolificCompleteUrl(completionCode);

    if (DATA_SUBMIT_URL) {
      const note = isGoogleAppsScriptUrl(DATA_SUBMIT_URL)
        ? 'Uploading data… (Apps Script no-cors: if Sheet/Drive stay empty, check Apps Script → Executions for errors)'
        : 'Uploading data to the server…';
      showSavingScreen(note);
    } else {
      showSavingScreen('Server saving is not configured; downloading a local file instead.');
    }

    let saved = false;
    try {
      const result = await saveAllDataToServer(jsPsych);
      saved = result.ok === true;
      if (result.skipped) {
        console.warn('[WARN] server save skipped:', result.message);
      } else {
        console.debug('[DEBUG] server save ok:', result.message);
      }
    } catch (e) {
      console.error('[ERROR] server save failed', e);
    }

    // Fallback: local download (useful for piloting, not reliable for Prolific)
    if (!saved) {
      try {
        jsPsych.data.get().localSave('csv', `data_${prolific_pid}.csv`);
      } catch (e) {
        console.error('[ERROR] localSave failed', e);
      }
    }

    // Redirect to Prolific completion page if we have a completion code.
    if (completionUrl) {
      window.location.href = completionUrl;
      return;
    }

    // If no completion code configured, show a clear end screen.
    const el = document.getElementById('jspsych-target');
    if (el) {
      el.innerHTML = `
        <div style="max-width:760px;margin:3rem auto;text-align:center;line-height:1.5;">
          <h2>Finished</h2>
          <p>Your responses have been recorded.</p>
          <p><strong>Researcher note:</strong> set PROLIFIC_COMPLETION_CODE or add ?cc=XXXX to the URL to redirect participants back to Prolific.</p>
        </div>
      `;
    }
  }
});

// Helpful for debugging: ensure we're collecting data at all.
console.debug('[DEBUG] jsPsych initialized. Current timeline position will be shown in Data tab as trials run.');

// Capture Prolific ID and other URL parameters
const subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
const study_id = jsPsych.data.getURLVariable('STUDY_ID');
const session_id = jsPsych.data.getURLVariable('SESSION_ID');

jsPsych.data.addProperties({
  subject_id: subject_id,
  study_id: study_id,
  session_id: session_id
});

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function buildPracticeHtml(stimulus) {
  return `
    <div class="practice-container">
      <div class="practice-grid">
        <div>
          <img src="${stimulus.src}" alt="${stimulus.label}" />
        </div>
        <div class="instructions" style="text-align: left;">
          <h3>Practice Trial</h3>
          <p>1. Use your mouse (or trackpad) to move the slider bar below the image.</p>
          <p>2. Adjust the slider to assign attractiveness by clicking and dragging the marker.</p>
          <p>3. Click the "Click to continue" button to confirm your selection.</p>
        </div>
      </div>
      <div id="point-value" class="point-value">Your point is 0.00</div>
    </div>
  `;
}

function buildMainHtml(stimulus) {
  return `
    <div class="main-trial-container">
      <img src="${stimulus.src}" alt="${stimulus.label}" />
      <div id="point-value" class="point-value">Your point is 0.00</div>
    </div>
  `;
}

function sliderLabels() {
  return [
    '1<br>Not at all attractive',
    '2<br>Barely<br>attractive',
    '3<br>Weakly<br>attractive',
    '4<br>Neutral<br>attractive',
    '5<br>Moderately<br>attractive',
    '6<br>Very<br>attractive',
    '7<br>Extremely<br>attractive'
  ];
}

function preferenceLabels() {
  return [
    '-3<br>Strongly<br>prefer left',
    '-2<br>Moderately<br>prefer left',
    '-1<br>Slightly<br>prefer left',
    '0<br>No<br>preference',
    '+1<br>Slightly<br>prefer right',
    '+2<br>Moderately<br>prefer right',
    '+3<br>Strongly<br>prefer right'
  ];
}

function buildPreferenceHtml({ familiar, novel, familiar_on_left }) {
  const left = familiar_on_left ? familiar : novel;
  const right = familiar_on_left ? novel : familiar;

  return `
    <div class="preference-container" style="max-width: 1100px; margin: 0 auto;">
      <div class="practice-grid" style="grid-template-columns: 1fr 1fr; align-items: start; gap: 2rem;">
        <div style="text-align:center;">
          <img src="${left.src}" alt="${left.label}" style="max-width: 100%; height: auto;" />
          <div style="margin-top:.5rem; opacity:.9;">Left image</div>
        </div>
        <div style="text-align:center;">
          <img src="${right.src}" alt="${right.label}" style="max-width: 100%; height: auto;" />
          <div style="margin-top:.5rem; opacity:.9;">Right image</div>
        </div>
      </div>
      <div id="point-value" class="point-value">Your preference is 0</div>
      <div style="text-align:center; margin-top:.5rem; font-size: 0.95rem; opacity: .9;">
        Use the slider to indicate which image you prefer.
      </div>
    </div>
  `;
}

function utcNow() {
  return new Date().toISOString();
}

function groupByCategory(stimuli) {
  const groups = new Map();
  for (const s of stimuli) {
    const key = (s.category || 'uncategorized').toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return groups;
}

function normalizeCategory(category) {
  return String(category || 'uncategorized').trim().toLowerCase();
}

function pushRatingToCache(cache, category, row) {
  const key = normalizeCategory(category);
  if (!cache.has(key)) cache.set(key, []);
  cache.get(key).push(row);
}

function selectFamiliarFromRatings(jsPsych, category, ratingCache) {
  const normalized_category = normalizeCategory(category);
  let ratingRows = jsPsych.data
    .get()
    .filter({ task: 'rating', normalized_category })
    .values();

  // Fallback to the in-memory cache if jsPsych's data store is empty
  if ((!ratingRows || ratingRows.length === 0) && ratingCache?.size) {
    ratingRows = ratingCache.get(normalized_category) || [];
  }

  if (!ratingRows || ratingRows.length === 0) return null;

  const sorted = [...ratingRows].sort((a, b) => {
    const ra = Number(a.rating ?? a.response);
    const rb = Number(b.rating ?? b.response);
    if (rb !== ra) return rb - ra;
    return String(a.stimulus_label).localeCompare(String(b.stimulus_label));
  });

  const familiarIndex = Math.min(9, Math.max(0, sorted.length - 1));
  return {
    src: sorted[familiarIndex].stimulus_src,
    label: sorted[familiarIndex].stimulus_label,
    category,
    rating: Number(sorted[familiarIndex].rating ?? sorted[familiarIndex].response)
  };
}

function ageRangeToAgeGroup(ageRange) {
  if (!ageRange) return null;
  const young = ['18-24', '25-34'];
  if (young.includes(ageRange)) return 'young_adult';
  return 'adult';
}

function genderAtBirthToToken(gender) {
  if (!gender) return null;
  const g = gender.toLowerCase();
  if (g === 'male' || g === 'female') return g[0].toUpperCase() + g.slice(1);
  return null;
}

function buildIngroupFolderName(profile) {
  const g = genderAtBirthToToken(profile.gender_birth);
  const r = profile.race?.toLowerCase();
  const ageGroup = ageRangeToAgeGroup(profile.age_range);
  if (!g || !r || !ageGroup) return null;
  return `${g}-${r}-${ageGroup}-neutral`;
}

function indexStimuliByCategoryAndSet(stimuli) {
  const index = {
    face: new Map(),
    geometry: new Map(),
    natural_scene: new Map()
  };
  for (const s of stimuli) {
    const cat = normalizeCategory(s.category);
    const setId = s.set || '__root';
    if (!index[cat]) index[cat] = new Map();
    if (!index[cat].has(setId)) index[cat].set(setId, []);
    index[cat].get(setId).push(s);
  }
  return index;
}

function buildFaceSetPlan(index, profile) {
  const faceMap = index.face || new Map();
  if (!faceMap || faceMap.size === 0) return [];

  const plan = [];
  const ingroup = buildIngroupFolderName(profile);

  if (ingroup && faceMap.has(ingroup)) {
    plan.push({
      category: 'face',
      set_id: ingroup,
      set_label: ingroup,
      stimuli: shuffle([...faceMap.get(ingroup)])
    });
  }

  const outgroupKeys = shuffle([...faceMap.keys()].filter(k => k !== ingroup));
  for (const key of outgroupKeys.slice(0, 3)) {
    plan.push({
      category: 'face',
      set_id: key,
      set_label: key,
      stimuli: shuffle([...faceMap.get(key)])
    });
  }

  return plan;
}

function buildSortedSetPlan(categoryKey, map) {
  if (!map || map.size === 0) return [];
  return [...map.keys()].sort((a, b) => a.localeCompare(b)).map(setId => ({
    category: categoryKey,
    set_id: setId,
    set_label: setId,
    stimuli: shuffle([...map.get(setId)])
  }));
}

function buildExperimentPlan(stimuli, profile) {
  const index = indexStimuliByCategoryAndSet(stimuli);
  const categoryOrder = shuffle(['face', 'geometry', 'natural_scene']);
  const plan = [];

  for (const cat of categoryOrder) {
    if (cat === 'face') {
      plan.push(...buildFaceSetPlan(index, profile));
    } else if (cat === 'geometry') {
      plan.push(...buildSortedSetPlan(cat, index.geometry));
    } else if (cat === 'natural_scene') {
      plan.push(...buildSortedSetPlan(cat, index.natural_scene));
    }
  }

  return plan;
}

function buildSetTimelineEntries({ category, set_id, set_label, stimuli }, ratingCache) {
  const normalized_category = normalizeCategory(set_id);
  const timeline = [];
  const shuffledStimuli = shuffle([...stimuli]);

  if (shuffledStimuli.length < 37) {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div class="practice-container" style="text-align:center;">
          <h2>Setup error</h2>
          <p>Set <strong>${set_label}</strong> in category <strong>${category}</strong> has only ${shuffledStimuli.length} images, but requires at least 37 (Set1=19, Set2=18).</p>
          <p>Please contact the researcher.</p>
        </div>
      `,
      choices: 'ALL_KEYS',
      data: { trial_type: 'fatal_category_count', category: set_id, category_type: category, required: 37, available: shuffledStimuli.length }
    });
    return timeline;
  }

  const set1 = shuffledStimuli.slice(0, 19);
  const set2 = shuffledStimuli.slice(19, 37);

  // Category/set header
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;">
        <h2>Category: ${category}</h2>
        <p>Set: <strong>${set_label}</strong></p>
        <p>You will first preview and rate 19 images, then make preference judgments for 18 new images.</p>
        <p>Press <strong>Space</strong> to continue.</p>
      </div>
    `,
    choices: [' '],
    data: { trial_type: 'category_intro', category: set_id, category_type: category, normalized_category, set_label, set1_n: set1.length, set2_n: set2.length }
  });

  // Preview instructions
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;">
        <h3>Preview</h3>
        <p>You will now preview the images in this set.</p>
        <p>Press <strong>Space</strong> to start the preview.</p>
      </div>
    `,
    choices: [' '],
    data: { trial_type: 'preview_instructions', category: set_id, category_type: category, normalized_category, set_label }
  });

  // Preview trials
  for (const stim of set1) {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div class="main-trial-container">
          <img src="${stim.src}" alt="${stim.label}" />
        </div>
      `,
      choices: 'NO_KEYS',
      trial_duration: 750,
      data: {
        trial_type: 'preview',
        stage: 'preview',
        category: set_id,
        category_type: category,
        normalized_category,
        set_label,
        stimulus_src: stim.src,
        stimulus_label: stim.label,
        utc_start: utcNow()
      },
      on_finish: (data) => {
        data.utc_end = utcNow();
      }
    });
  }

  // Rating instructions
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;">
        <h3>Rating</h3>
        <p>You will now rate the same images.</p>
        <p>Use the slider from 1 (not attractive) to 7 (extremely attractive).</p>
        <p>Press <strong>Space</strong> to start.</p>
      </div>
    `,
    choices: [' '],
    data: { trial_type: 'rating_instructions', category: set_id, category_type: category, normalized_category, set_label }
  });

  // Rating trials
  for (const stim of set1) {
    timeline.push({
      type: jsPsychHtmlSliderResponse,
      stimulus: buildMainHtml(stim),
      min: 1,
      max: 7,
      step: 0.05,
      slider_start: 4,
      require_movement: true,
      slider_width: 800,
      labels: sliderLabels(),
      button_label: 'Click to continue',
      data: {
        task: 'rating',
        stage: 'rating',
        category: set_id,
        category_type: category,
        normalized_category,
        set_label,
        stimulus_src: stim.src,
        stimulus_label: stim.label,
        utc_start: utcNow()
      },
      on_load: () => {
        const slider = document.querySelector('#jspsych-html-slider-response-response');
        const pointLabel = document.getElementById('point-value');
        if (!slider || !pointLabel) return;
        const updatePoint = () => {
          const value = parseFloat(slider.value);
          if (!Number.isNaN(value)) {
            pointLabel.textContent = `Your point is ${value.toFixed(2)}`;
          }
        };
        slider.addEventListener('input', updatePoint);
        updatePoint();
      },
      on_finish: (data) => {
        data.utc_end = utcNow();
        const ratingValue = Number(data.response);
        data.rating = ratingValue;

        const cachedRow = {
          task: 'rating',
          stage: 'rating',
          category: data.category,
          category_type: data.category_type,
          normalized_category: data.normalized_category,
          set_label: data.set_label,
          stimulus_src: data.stimulus_src,
          stimulus_label: data.stimulus_label,
          utc_start: data.utc_start,
          utc_end: data.utc_end,
          rt: data.rt,
          response: ratingValue,
          rating: ratingValue
        };

        pushRatingToCache(ratingCache, data.category, cachedRow);

        try {
          jsPsych.data.write({ ...cachedRow, wrote_fallback: true });
        } catch (e) {
          console.warn('[DEBUG] fallback write failed', e);
        }
      }
    });

  }

  // Familiar selection
  const familiarVariable = `familiar_${set_id}`;
  timeline.push({
    type: jsPsychCallFunction,
    async: false,
    data: { trial_type: 'compute_familiar', category: set_id, category_type: category, normalized_category },
    func: () => {
      const familiarFromRatings = selectFamiliarFromRatings(jsPsych, set_id, ratingCache);
      const fallbackFamiliar = set1[Math.min(9, Math.max(0, set1.length - 1))];
      const familiar = familiarFromRatings || fallbackFamiliar || null;
      window.__FAMILIAR_BY_CATEGORY__ = window.__FAMILIAR_BY_CATEGORY__ || {};
      window.__FAMILIAR_BY_CATEGORY__[familiarVariable] = familiar;

      const ratingCount = jsPsych.data.get().filter({ task: 'rating', normalized_category }).count();
      const cacheCount = ratingCache.get(normalized_category)?.length || 0;
      console.debug('[DEBUG] compute_familiar', {
        category: set_id,
        normalized_category,
        ratingCount,
        cacheCount,
        familiar,
        familiar_source: familiarFromRatings ? 'ratings' : 'fallback_set1_index9'
      });

      if (!familiar) {
        jsPsych.data.write({
          trial_type: 'compute_familiar_failed',
          category: set_id,
          category_type: category,
          normalized_category,
          message: 'No rating trials found for this set; cannot select familiar image.',
          ratingCount,
          cacheCount
        });
      } else if (!familiarFromRatings) {
        jsPsych.data.write({
          trial_type: 'compute_familiar_fallback',
          category: set_id,
          category_type: category,
          normalized_category,
          fallback_src: familiar?.src,
          fallback_label: familiar?.label,
          ratingCount,
          cacheCount
        });
      }
    }
  });

  // Debug screen if familiar missing
  timeline.push({
    timeline: [{
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => {
        const allData = jsPsych.data.get();
        const allCount = allData.count();
        const allValues = allData.values();

        const trialTypes = [...new Set(allValues.map(x => x.trial_type))];
        const ratingTrials = allData.filter({ task: 'rating' }).values();
        const ratingCategories = [...new Set(ratingTrials.map(x => x.normalized_category))];

        const rows = jsPsych.data.get().filter({ task: 'rating', normalized_category }).values();
        const count = rows.length;

        const sample = rows.slice(0, 3).map(r => {
          const resp = (r.rating ?? r.response);
          return `<li>${r.stimulus_label} | response=${resp} | cat=${r.category} | norm=${r.normalized_category}</li>`;
        }).join('') || '<li>No rating rows found.</li>';

        const last5 = allValues.slice(-5).map(r =>
          `<li>Type: ${r.trial_type}, Task: ${r.task}, Cat: ${r.normalized_category}, Resp: ${r.response}</li>`
        ).join('');

        return `
          <div class="practice-container" style="text-align:left; max-width: 900px; margin: 2rem auto; overflow-y: auto; max-height: 80vh;">
            <h2>Debug: Familiar selection failed</h2>
            <p><strong>Target Set:</strong> "${set_label}" (normalized: "${normalized_category}")</p>
            <p><strong>Filtered Rating Count:</strong> ${count}</p>
            <hr>
            <h3>Global Data Status</h3>
            <p><strong>Total Trials in Data:</strong> ${allCount}</p>
            <p><strong>Plugin Types Found:</strong> ${trialTypes.join(', ')}</p>
            <p><strong>Categories found in 'rating' tasks:</strong> ${ratingCategories.join(', ')}</p>
            <hr>
            <h3>First 3 Rating Rows</h3>
            <ul>${sample}</ul>
            <h3>Last 5 Trials (Raw)</h3>
            <ul>${last5}</ul>
            <hr>
            <p>If 'Total Trials' is 0, data is not saving at all.</p>
            <p>If the 'rating' task is not saving correctly, the filtered count will be 0.</p>
            <p>Press <strong>Space</strong> to continue.</p>
          </div>
        `;
      },
      choices: [' '],
      data: { trial_type: 'debug_familiar_failed', category: set_id, category_type: category, normalized_category, set_label }
    }],
    conditional_function: () => {
      const familiar = window.__FAMILIAR_BY_CATEGORY__?.[familiarVariable];
      return !familiar;
    }
  });

  // Preference instructions
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => {
      const familiar = window.__FAMILIAR_BY_CATEGORY__?.[familiarVariable];
      const familiarText = familiar ? `Familiar image selected: <strong>${familiar.label}</strong>.` : 'Familiar image could not be selected.';
      return `
        <div class="practice-container" style="text-align:center;">
          <h3>Next: Preference judgments</h3>
          <p>Set: <strong>${set_label}</strong></p>
          <p>${familiarText}</p>
          <p>Next, you will compare the familiar image to new images from the same set.</p>
          <p>Press <strong>Space</strong> to continue.</p>
        </div>
      `;
    },
    choices: [' '],
    data: { trial_type: 'preference_instructions', category: set_id, category_type: category, normalized_category, set_label }
  });

  // Preference trials with fixation
  for (const novel of set2) {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="font-size:48px; text-align:center;">+</div>`,
      choices: 'NO_KEYS',
      trial_duration: 700,
      data: { trial_type: 'preference_fixation', stage: 'preference', category: set_id, category_type: category, normalized_category, set_label }
    });

    timeline.push({
      type: jsPsychHtmlSliderResponse,
      stimulus: function () {
        const familiar = window.__FAMILIAR_BY_CATEGORY__?.[familiarVariable];

        if (!familiar) {
          return `
            <div class="practice-container" style="text-align:center;">
              <h2>Experiment Error</h2>
              <p>Could not find the familiar image for set <strong>${set_label}</strong>.</p>
              <p>The experiment cannot continue. Please contact the researcher.</p>
            </div>
          `;
        }

        const familiar_on_left = Math.random() < 0.5;
        this.familiar_on_left = familiar_on_left;
        this.familiar = familiar;

        return buildPreferenceHtml({ familiar, novel, familiar_on_left });
      },
      min: -3,
      max: 3,
      step: 1,
      slider_start: 0,
      require_movement: true,
      slider_width: 800,
      labels: preferenceLabels(),
      button_label: 'Click to continue',
      data: function () {
        return {
          task: 'preference',
          trial_type: 'preference',
          stage: 'preference',
          category: set_id,
          category_type: category,
          normalized_category,
          set_label,
          utc_start: utcNow(),
          familiar_src: this.familiar?.src,
          familiar_label: this.familiar?.label,
          novel_src: novel.src,
          novel_label: novel.label,
          familiar_on_left: this.familiar_on_left,
          familiar_side: this.familiar_on_left ? 'left' : 'right',
          novel_side: this.familiar_on_left ? 'right' : 'left'
        };
      },
      on_load: () => {
        const slider = document.querySelector('#jspsych-html-slider-response-response');
        const pointLabel = document.getElementById('point-value');
        if (!slider || !pointLabel) return;
        const updatePoint = () => {
          const value = parseInt(slider.value, 10);
          if (!Number.isNaN(value)) {
            pointLabel.textContent = `Your preference is ${value}`;
          }
        };
        slider.addEventListener('input', updatePoint);
        updatePoint();
      },
      on_finish: (data) => {
        data.utc_end = utcNow();
        data.preference = data.response;
        const familiar_on_left = data.familiar_on_left === true;
        data.familiar_side = familiar_on_left ? 'left' : 'right';
        data.novel_side = familiar_on_left ? 'right' : 'left';
        data.left_src = familiar_on_left ? data.familiar_src : data.novel_src;
        data.left_label = familiar_on_left ? data.familiar_label : data.novel_label;
        data.right_src = familiar_on_left ? data.novel_src : data.familiar_src;
        data.right_label = familiar_on_left ? data.novel_label : data.familiar_label;
      }
    });
  }

  return timeline;
}

async function main() {
  // Use global variable from stimuli.js, or empty array if missing
  let stimuli = window.STIMULI_DATA || [];

  if (stimuli.length === 0) {
    alert('No stimuli found! Make sure stimuli.js is loaded.');
    return;
  }

  // Shuffle stimuli globally (we will reshuffle within each category as well)
  stimuli = shuffle(stimuli);

  const timeline = [];
  const ratingCache = new Map();
  const participantProfile = { age_range: null, gender_birth: null, race: null };

  // 1. Preload all images
  timeline.push({
    type: jsPsychPreload,
    images: stimuli.map(s => s.src)
  });

  // 2. Browser & Device Check
  timeline.push({
    type: jsPsychBrowserCheck,
    inclusion_function: (data) => {
      return data.mobile === false;
    },
    exclusion_message: (data) => {
      if (data.mobile) {
        return '<p>You must use a desktop or laptop computer to participate in this experiment.</p>';
      }
      return '<p>Your browser does not meet the requirements.</p>';
    }
  });

  // 3. Consent Form
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="consent-form" style="text-align: left; max-width: 800px; margin: 2rem auto; line-height: 1.6;">
        <h2>Informed Consent</h2>
        <p><strong>Purpose:</strong> You are invited to participate in a research study about visual perception and aesthetics. The purpose is to understand how people evaluate the attractiveness of different scenes.</p>
        
        <p><strong>Procedure:</strong> In this task, you will view a series of images and rate their attractiveness using a slider. The task will take approximately 10-15 minutes.</p>
        
        <p><strong>Risks and Benefits:</strong> There are no known risks associated with this study beyond those encountered in daily life. There are no direct benefits to you, but your participation will contribute to scientific knowledge.</p>
        
        <p><strong>Payment:</strong> You will receive payment as specified on the Prolific study page upon successful completion of the task.</p>
        
        <p><strong>Data Handling:</strong> Your data will be anonymous and identified only by your Prolific ID. The data will be stored securely and may be shared with other researchers in an anonymized form.</p>
        
        <p><strong>Right to Withdraw:</strong> Your participation is voluntary. You may withdraw at any time by closing the browser window without penalty, though you will not be paid if the task is not completed.</p>
        
        <p><strong>Contact:</strong> If you have any questions, please contact the researcher via the Prolific messaging system.</p>
        
        <p>By clicking "I Consent" below, you confirm that you have read this information and agree to participate.</p>
      </div>
    `,
    choices: ['I Consent', 'I Do Not Consent'],
    on_finish: function (data) {
      if (data.response == 1) {
        jsPsych.endExperiment('You did not consent to participate. You may close this window.');
      }
    }
  });

  // 4. Demographics
  timeline.push({
    type: jsPsychSurveyHtmlForm,
    preamble: '<h3>Demographics</h3><p>Please answer the following questions about yourself.</p>',
    html: `
      <div style="text-align: left; max-width: 400px; margin: auto;">
        <p>
          <label for="age"><strong>Age Range:</strong></label><br>
          <select id="age" name="age" required style="width: 100%; padding: 5px;">
             <option value="" disabled selected>Select your age range</option>
             <option value="18-24">18-24</option>
             <option value="25-34">25-34</option>
             <option value="35-44">35-44</option>
             <option value="45-54">45-54</option>
             <option value="55-64">55-64</option>
             <option value="65+">65+</option>
             <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </p>
        <p>
          <label for="gender_birth"><strong>Gender at birth:</strong></label><br>
          <select id="gender_birth" name="gender_birth" required style="width: 100%; padding: 5px;">
             <option value="" disabled selected>Select your gender at birth</option>
             <option value="female">Female</option>
             <option value="male">Male</option>
             <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </p>
        <p>
          <label for="race"><strong>Race:</strong></label><br>
          <select id="race" name="race" required style="width: 100%; padding: 5px;">
             <option value="" disabled selected>Select your race</option>
             <option value="asian">Asian</option>
             <option value="black">Black</option>
             <option value="latino">Latino</option>
             <option value="white">White</option>
             <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </p>
      </div>
    `,
    button_label: 'Continue',
    on_finish: (data) => {
      const resp = data.response || {};
      participantProfile.age_range = resp.age;
      participantProfile.gender_birth = resp.gender_birth;
      participantProfile.race = resp.race;
      jsPsych.data.addProperties({
        age_range: resp.age,
        gender_birth: resp.gender_birth,
        race: resp.race
      });
    }
  });

  // 5. Fullscreen
  timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: '<p>The experiment will switch to full screen mode when you press the button below.</p>'
  });

  // 6. Welcome & Instructions
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;">
        <h1>Welcome to the Experiment</h1>
        <p style="max-width:740px;margin:0 auto 1rem;">
          You will complete the steps below for each image set. Please read carefully before starting.
        </p>
        <div style="text-align:left; display:inline-block; max-width:700px; margin:0 auto; font-size:1rem; line-height:1.5;">
          <ol style="text-align:left; padding-left:1.5rem;">
            <li><strong>Preview:</strong> images appear briefly so you know what is coming.</li>
            <li><strong>Rating (1–7):</strong> move the slider to show attractiveness; you must move it each time and click “Click to continue”.</li>
            <li><strong>Preference (-3…+3):</strong> a “familiar” image (from your earlier ratings) is paired with a new one; use the slider to show which you prefer and how strongly.</li>
          </ol>
          <p>All images in a set are unique, and each set may come from a different folder (e.g., Face in-group/out-group, Geometry types, Natural scenes).</p>
        </div>
        <p style="margin-top:1rem;">Press the <strong>Space Bar</strong> to begin.</p>
      </div>
    `,
    choices: [' '],
    data: { trial_type: 'intro' }
  });

  // --- Category-wise two-stage paradigm ---
  const outroBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;">
        <h2>Experiment Complete</h2>
        <p>Thank you for your participation.</p>
        <p>Press any key to finish and save your data.</p>
      </div>
    `,
    choices: "ALL_KEYS",
    data: { trial_type: "outro" }
  };

  const exitFullscreenBlock = {
    type: jsPsychFullscreen,
    fullscreen_mode: false
  };

  // Build and append category/set timelines once demographics are known
  timeline.push({
    type: jsPsychCallFunction,
    async: false,
    data: { trial_type: "build_plan" },
    func: () => {
      let plan = buildExperimentPlan(stimuli, participantProfile);

      // Optional: restrict the run to one category or one set for testing.
      // Examples:
      //   ?only_category=face
      //   ?only_category=geometry
      //   ?only_category=natural_scene
      //   ?only_set=Simple-symmetric
      //   ?only_set=Female-asian-adult-neutral
      const onlyCategory = getUrlParam('only_category');
      const onlySet = getUrlParam('only_set');

      if (onlyCategory) {
        const onlyCatNorm = normalizeCategory(onlyCategory);
        plan = plan.filter(p => normalizeCategory(p.category) === onlyCatNorm);
      }

      if (onlySet) {
        const onlySetNorm = normalizeCategory(onlySet);
        plan = plan.filter(p => normalizeCategory(p.set_id) === onlySetNorm);
      }

      console.debug('[DEBUG] experiment plan', {
        only_category: onlyCategory,
        only_set: onlySet,
        total_sets: plan.length,
        sets: plan.map(p => ({ category: p.category, set_id: p.set_id }))
      });

      // Check for direct questionnaire test
      const testQuestionnaire = hasUrlFlag('test_questionnaire');

      const builtTimeline = [];
      if (!testQuestionnaire) {
        const timelineFromSets = plan.flatMap(setInfo => buildSetTimelineEntries(setInfo, ratingCache));
        builtTimeline.push(...timelineFromSets);
      }

      // Add Full Questionnaire Suite after the task (or alone if testing)
      builtTimeline.push(...getAllQuestionnaireBlocks());

      builtTimeline.push(outroBlock, exitFullscreenBlock);
      jsPsych.addNodeToEndOfTimeline({ timeline: builtTimeline });
    }
  });

  await jsPsych.run(timeline);
}

if (hasUrlFlag('save_test')) {
  runSaveSmokeTest();
} else {
  main().catch((error) => {
    document.getElementById('jspsych-target').innerHTML = `
      <div style="max-width:600px;margin:4rem auto;text-align:center;color:#fff;">
        <h2>Setup error</h2>
        <p>${error.message}</p>
        <p>Double-check that <code>stimuli_manifest.json</code> exists and is reachable.</p>
      </div>
    `;
    console.error(error);
  });
}
