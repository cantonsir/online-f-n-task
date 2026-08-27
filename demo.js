(function () {
  'use strict';

  const target = document.getElementById('jspsych-target');
  const allStimuli = Array.isArray(window.STIMULI_DATA) ? window.STIMULI_DATA : [];
  const geometryStimuli = allStimuli.filter((stimulus) =>
    stimulus.category === 'geometry' && stimulus.set === 'Simple-symmetric'
  );

  if (geometryStimuli.length < 37) {
    target.innerHTML = `
      <div class="practice-container" style="text-align:center;line-height:1.6;">
        <h2>Demonstration unavailable</h2>
        <p>The demonstration requires 37 images from one stimulus set.</p>
      </div>
    `;
    return;
  }

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  function singleImageHtml(stimulus) {
    return `
      <div class="main-trial-container">
        <img src="${stimulus.src}" alt="${stimulus.label}" />
        <div id="point-value" class="point-value">Your point is 0.00</div>
      </div>
    `;
  }

  function previewImageHtml(stimulus) {
    return `
      <div class="main-trial-container">
        <img src="${stimulus.src}" alt="${stimulus.label}" />
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
            <img src="${left.src}" alt="${left.label}" style="max-width:100%;height:auto;" />
            <div style="margin-top:.5rem;opacity:.9;">Left image</div>
          </div>
          <div style="text-align:center;">
            <img src="${right.src}" alt="${right.label}" style="max-width:100%;height:auto;" />
            <div style="margin-top:.5rem;opacity:.9;">Right image</div>
          </div>
        </div>
        <div id="point-value" class="point-value">Your preference is 0.00</div>
        <div style="text-align:center;margin-top:.5rem;font-size:.95rem;opacity:.9;">
          Use the slider to indicate which image you prefer.
        </div>
      </div>
    `;
  }

  function attachSliderReadout(prefix) {
    const slider = document.querySelector('#jspsych-html-slider-response-response');
    const output = document.getElementById('point-value');
    if (!slider || !output) return;

    const update = () => {
      const value = Number(slider.value);
      output.textContent = `${prefix}${value.toFixed(2)}`;
    };

    slider.addEventListener('input', update);
    update();
  }

  const ratingLabels = [
    '1<br>Not at all attractive',
    '2<br>Barely<br>attractive',
    '3<br>Weakly<br>attractive',
    '4<br>Neutral<br>attractive',
    '5<br>Moderately<br>attractive',
    '6<br>Very<br>attractive',
    '7<br>Extremely<br>attractive'
  ];

  const preferenceLabels = [
    '-3<br>Strongly<br>prefer left',
    '-2<br>Moderately<br>prefer left',
    '-1<br>Slightly<br>prefer left',
    '0<br>No<br>preference',
    '+1<br>Slightly<br>prefer right',
    '+2<br>Moderately<br>prefer right',
    '+3<br>Strongly<br>prefer right'
  ];

  // Match the original task: Set 1 has 19 preview/rating images and Set 2 has 18 novel images.
  const shuffledSet = shuffle(geometryStimuli);
  const set1 = shuffledSet.slice(0, 19);
  const set2 = shuffledSet.slice(19, 37);
  const practiceStimulus = allStimuli.find((stimulus) => stimulus.category === 'natural_scene') || set2[3];
  const demoRatings = [];

  function selectFamiliar() {
    const sortedRatings = [...demoRatings].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.stimulus.label.localeCompare(b.stimulus.label);
    });

    // The original task uses the 10th-ranked image (zero-based index 9).
    return sortedRatings[9]?.stimulus || set1[9];
  }

  const jsPsych = initJsPsych({
    display_element: 'jspsych-target',
    on_finish: function () {
      // Explicitly discard all in-memory demonstration responses.
      jsPsych.data.reset();

      target.innerHTML = `
        <div class="practice-container" style="text-align:center;line-height:1.6;max-width:720px;">
          <div style="display:inline-block;padding:.35rem .75rem;border:1px solid #72c7ff;border-radius:999px;color:#9dd9ff;font-weight:700;">Demonstration only</div>
          <h2 style="margin-top:1.25rem;">Demo complete</h2>
          <p>You completed one full Simple-symmetric geometry subcategory.</p>
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
    images: [practiceStimulus, ...set1, ...set2].map((stimulus) => stimulus.src)
  });

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="practice-container" style="text-align:left;line-height:1.65;max-width:800px;">
        <div style="display:inline-block;padding:.35rem .75rem;border:1px solid #72c7ff;border-radius:999px;color:#9dd9ff;font-weight:700;">Non-recording demonstration</div>
        <h1 style="margin-top:1.25rem;">Online familiarity–novelty task</h1>
        <p>This demonstration follows one complete Simple-symmetric geometry subcategory from the original task.</p>
        <p>It includes the full 19-image preview and rating sequence followed by all 18 comparative trials.</p>
        <p>Consent, demographics, questionnaires, and fullscreen mode are omitted.</p>
        <p><strong>No responses, identifiers, or browser information are recorded or submitted.</strong></p>
      </div>
    `,
    choices: ['Begin demo']
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:left;max-width:800px;margin:auto;line-height:1.6;">
        <h1>Instructions</h1>
        <h3>Task Overview</h3>
        <p>The task consists of three phases:</p>
        <ul>
          <li><strong>Phase 1: Image Preview</strong></li>
          <li><strong>Phase 2: Single Image Evaluation</strong></li>
          <li><strong>Phase 3: Comparative Evaluation</strong></li>
        </ul>
        <p>Press <strong>Space</strong> to continue.</p>
      </div>
    `,
    choices: [' ']
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:left;max-width:800px;margin:auto;line-height:1.6;">
        <h1>Instructions</h1>
        <h3>Phase 1: Image Preview</h3>
        <ul>
          <li>A series of images will be presented rapidly.</li>
          <li>This gives you an intuitive grasp of the range of images you will evaluate.</li>
        </ul>
        <h3>Phase 2: Single Image Evaluation</h3>
        <ul>
          <li>Evaluate each image's attractiveness on a 7-point scale.</li>
          <li>The rating procedure is self-paced.</li>
          <li>Respond based on your immediate impression.</li>
        </ul>
        <p>Press <strong>Space</strong> to continue.</p>
      </div>
    `,
    choices: [' ']
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:left;max-width:800px;margin:auto;line-height:1.6;">
        <h1>Instructions</h1>
        <h3>Phase 3: Comparative Evaluation</h3>
        <p>Compare two images presented side-by-side and indicate your relative preference:</p>
        <ul>
          <li><strong>-3</strong>: Strong preference for the image on the left.</li>
          <li><strong>0</strong>: Neutral, no preference.</li>
          <li><strong>+3</strong>: Strong preference for the image on the right.</li>
        </ul>
        <p>Press <strong>Space</strong> to continue.</p>
      </div>
    `,
    choices: [' ']
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;max-width:800px;margin:auto;">
        <h3>Practice Trial</h3>
        <p>Move the slider to rate the image, then click the continue button.</p>
        <p>Press <strong>Space</strong> to start.</p>
      </div>
    `,
    choices: [' ']
  });

  timeline.push({
    type: jsPsychHtmlSliderResponse,
    css_classes: ['visual-task'],
    stimulus: singleImageHtml(practiceStimulus),
    min: 1,
    max: 7,
    step: 0.05,
    slider_start: 4,
    require_movement: true,
    slider_width: 800,
    labels: ratingLabels,
    button_label: 'Click to continue',
    on_load: () => attachSliderReadout('Your point is ')
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;max-width:800px;margin:auto;">
        <h2>Practice Complete</h2>
        <p>You are now ready to begin the demonstration block.</p>
        <p>Press <strong>Space</strong> to continue.</p>
      </div>
    `,
    choices: [' ']
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;">
        <h2>Next Block: Visual Evaluation</h2>
        <p>You will first preview and rate a set of images, then make preference judgments.</p>
        <p>Press <strong>Space</strong> to continue.</p>
      </div>
    `,
    choices: [' ']
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:left;max-width:800px;margin:auto;">
        <h3>Phase 1: Image Preview</h3>
        <ul>
          <li>A series of images will be presented rapidly.</li>
          <li>This phase provides an intuitive grasp of the range of images you will evaluate.</li>
        </ul>
        <div style="text-align:center;margin-top:2rem;">
          <p>Press <strong>Space</strong> to start the preview.</p>
        </div>
      </div>
    `,
    choices: [' ']
  });

  set1.forEach((stimulus) => {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: previewImageHtml(stimulus),
      choices: 'NO_KEYS',
      trial_duration: 750
    });
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:left;max-width:800px;margin:auto;">
        <h3>Phase 2: Single Image Evaluation</h3>
        <ul>
          <li>You will see one image at a time and evaluate its attractiveness.</li>
          <li>The rating procedure is <strong>self-paced</strong>.</li>
          <li>Rate each image on a <strong>7-point scale</strong> based on your immediate impression.</li>
        </ul>
        <div style="text-align:center;margin-top:2rem;">
          <p>Press <strong>Space</strong> to start.</p>
        </div>
      </div>
    `,
    choices: [' ']
  });

  set1.forEach((stimulus) => {
    timeline.push({
      type: jsPsychHtmlSliderResponse,
      css_classes: ['visual-task'],
      stimulus: singleImageHtml(stimulus),
      min: 1,
      max: 7,
      step: 0.05,
      slider_start: 4,
      require_movement: true,
      slider_width: 800,
      labels: ratingLabels,
      button_label: 'Click to continue',
      on_load: () => attachSliderReadout('Your point is '),
      on_finish: (data) => {
        demoRatings.push({ stimulus, rating: Number(data.response) });
      }
    });
  });

  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="practice-container" style="text-align:left;max-width:800px;margin:auto;">
        <h3>Phase 3: Comparative Evaluation</h3>
        <p>Compare two images presented side-by-side.</p>
        <ol>
          <li>Evaluate the images based on your relative preference.</li>
          <li>Indicate your preference using the 7-point scale.</li>
        </ol>
        <ul>
          <li><strong>-3</strong>: Strong preference for the image on the left.</li>
          <li><strong>0</strong>: Neutral, no preference.</li>
          <li><strong>+3</strong>: Strong preference for the image on the right.</li>
        </ul>
        <div style="text-align:center;margin-top:2rem;">
          <p>Press <strong>Space</strong> to continue.</p>
        </div>
      </div>
    `,
    choices: [' ']
  });

  set2.forEach((novel) => {
    const familiarOnLeft = Math.random() < 0.5;

    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<div style="font-size:48px;text-align:center;">+</div>',
      choices: 'NO_KEYS',
      trial_duration: 700
    });

    timeline.push({
      type: jsPsychHtmlSliderResponse,
      css_classes: ['visual-task'],
      stimulus: () => preferenceHtml(selectFamiliar(), novel, familiarOnLeft),
      min: -3,
      max: 3,
      step: 0.01,
      slider_start: 0,
      require_movement: true,
      slider_width: 800,
      labels: preferenceLabels,
      button_label: 'Click to continue',
      on_load: () => attachSliderReadout('Your preference is ')
    });
  });

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="practice-container" style="text-align:center;line-height:1.6;">
        <h2>Demonstration Complete</h2>
        <p>You have completed one full subcategory from the original task.</p>
        <p>The full study continues with additional subcategories.</p>
        <p>Click below to finish and discard the in-memory demo responses.</p>
      </div>
    `,
    choices: ['Finish demo']
  });

  jsPsych.run(timeline);
})();
