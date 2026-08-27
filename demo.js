(function () {
  'use strict';

  const target = document.getElementById('jspsych-target');
  const allStimuli = Array.isArray(window.STIMULI_DATA) ? window.STIMULI_DATA : [];
  const preferredSet = allStimuli.filter((stimulus) =>
    stimulus.category === 'geometry' && stimulus.set === 'Simple-symmetric'
  );
  const geometryStimuli = preferredSet.length >= 11
    ? preferredSet
    : allStimuli.filter((stimulus) => stimulus.category === 'geometry');

  if (geometryStimuli.length < 11) {
    target.innerHTML = `
      <div class="practice-container" style="text-align:center;line-height:1.6;">
        <h2>Demonstration unavailable</h2>
        <p>The demonstration stimuli could not be loaded.</p>
      </div>
    `;
    return;
  }

  function selectSpread(items, count) {
    if (count === 1) return [items[0]];
    return Array.from({ length: count }, (_, index) => {
      const itemIndex = Math.round(index * (items.length - 1) / (count - 1));
      return items[itemIndex];
    });
  }

  function singleImageHtml(stimulus) {
    return `
      <div class="main-trial-container">
        <img src="${stimulus.src}" alt="Geometric demonstration stimulus" />
      </div>
    `;
  }

  function preferenceHtml(familiar, novel, familiarOnLeft) {
    const left = familiarOnLeft ? familiar : novel;
    const right = familiarOnLeft ? novel : familiar;

    return `
      <div class="preference-container" style="max-width:1100px;margin:0 auto;">
        <div class="practice-grid" style="grid-template-columns:1fr 1fr;align-items:start;gap:2rem;">
          <div style="text-align:center;">
            <img src="${left.src}" alt="Left geometric stimulus" style="max-width:100%;max-height:38vh;object-fit:contain;" />
            <div style="margin-top:.5rem;opacity:.9;">Left image</div>
          </div>
          <div style="text-align:center;">
            <img src="${right.src}" alt="Right geometric stimulus" style="max-width:100%;max-height:38vh;object-fit:contain;" />
            <div style="margin-top:.5rem;opacity:.9;">Right image</div>
          </div>
        </div>
        <div id="point-value" class="point-value">Your preference is 0</div>
      </div>
    `;
  }

  function attachSliderReadout(prefix, digits) {
    const slider = document.querySelector('input[type="range"]');
    const output = document.getElementById('point-value');
    if (!slider || !output) return;

    const update = () => {
      const value = Number(slider.value);
      output.textContent = `${prefix}${value.toFixed(digits)}`;
    };

    slider.addEventListener('input', update);
    update();
  }

  const selectedStimuli = selectSpread(geometryStimuli, 11);
  const previewStimuli = selectedStimuli.slice(0, 6);
  const ratingStimuli = previewStimuli.slice(0, 3);
  const novelStimuli = selectedStimuli.slice(6, 8);
  const demoRatings = [];

  function familiarStimulus() {
    if (demoRatings.length === 0) return ratingStimuli[0];
    return [...demoRatings].sort((a, b) => b.rating - a.rating)[0].stimulus;
  }

  const ratingLabels = [
    '1<br>Not at all',
    '2',
    '3',
    '4<br>Neutral',
    '5',
    '6',
    '7<br>Extremely'
  ];

  const preferenceLabels = [
    '-3<br>Strongly prefer left',
    '-2',
    '-1',
    '0<br>No preference',
    '+1',
    '+2',
    '+3<br>Strongly prefer right'
  ];

  const jsPsych = initJsPsych({
    display_element: 'jspsych-target',
    on_finish: function () {
      target.innerHTML = `
        <div class="practice-container" style="text-align:center;line-height:1.6;max-width:720px;">
          <div style="display:inline-block;padding:.35rem .75rem;border:1px solid #72c7ff;border-radius:999px;color:#9dd9ff;font-weight:700;">Demonstration only</div>
          <h2 style="margin-top:1.25rem;">Demo complete</h2>
          <p>Your responses were used only to demonstrate the task flow.</p>
          <p><strong>No responses or personal information were recorded or submitted.</strong></p>
          <button id="restart-demo" class="jspsych-btn" type="button" style="margin-top:1rem;">Restart demo</button>
        </div>
      `;

      document.getElementById('restart-demo')?.addEventListener('click', () => window.location.reload());
    }
  });

  const timeline = [];

  timeline.push({
    type: jsPsychPreload,
    images: selectedStimuli.map((stimulus) => stimulus.src)
  });

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="practice-container" style="text-align:left;line-height:1.65;max-width:760px;">
        <div style="display:inline-block;padding:.35rem .75rem;border:1px solid #72c7ff;border-radius:999px;color:#9dd9ff;font-weight:700;">Non-recording demonstration</div>
        <h1 style="margin-top:1.25rem;">Online familiarity–novelty task</h1>
        <p>This short demonstration presents the three main phases used in the study:</p>
        <ol>
          <li>Rapid image preview</li>
          <li>Single-image attractiveness ratings</li>
          <li>Familiar-versus-novel preference judgments</li>
        </ol>
        <p>It takes approximately two minutes. Consent, demographics, questionnaires, and fullscreen mode are omitted.</p>
        <p><strong>No responses, identifiers, or browser information are recorded or submitted.</strong></p>
      </div>
    `,
    choices: ['Begin demo']
  });

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;line-height:1.6;">
        <h2>Phase 1: Image preview</h2>
        <p>A short series of images will appear automatically.</p>
      </div>
    `,
    choices: ['Start preview']
  });

  previewStimuli.forEach((stimulus) => {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: singleImageHtml(stimulus),
      choices: 'NO_KEYS',
      trial_duration: 750
    });
  });

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;line-height:1.6;">
        <h2>Phase 2: Single-image evaluation</h2>
        <p>Rate each image from 1 (not at all attractive) to 7 (extremely attractive).</p>
      </div>
    `,
    choices: ['Start ratings']
  });

  ratingStimuli.forEach((stimulus) => {
    timeline.push({
      type: jsPsychHtmlSliderResponse,
      stimulus: `${singleImageHtml(stimulus)}<div id="point-value" class="point-value">Your rating is 4</div>`,
      labels: ratingLabels,
      min: 1,
      max: 7,
      start: 4,
      step: 1,
      require_movement: true,
      button_label: 'Continue',
      on_load: () => attachSliderReadout('Your rating is ', 0),
      on_finish: (data) => {
        demoRatings.push({ stimulus, rating: Number(data.response) });
      }
    });
  });

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;line-height:1.6;">
        <h2>Phase 3: Familiar–novel preference</h2>
        <p>Your highest-rated familiar image will be paired with images not shown in the rating phase.</p>
        <p>Move the slider toward the image you prefer.</p>
      </div>
    `,
    choices: ['Start preferences']
  });

  novelStimuli.forEach((novel, index) => {
    const familiarOnLeft = index % 2 === 0;

    timeline.push({
      type: jsPsychHtmlSliderResponse,
      stimulus: '',
      labels: preferenceLabels,
      min: -3,
      max: 3,
      start: 0,
      step: 1,
      require_movement: true,
      button_label: 'Continue',
      on_start: (trial) => {
        trial.stimulus = preferenceHtml(familiarStimulus(), novel, familiarOnLeft);
      },
      on_load: () => attachSliderReadout('Your preference is ', 0)
    });
  });

  jsPsych.run(timeline);
})();
