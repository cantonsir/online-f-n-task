# jsPsych Multi-Category Preference Task

Browser-based experiment with rating and preference judgments across Face, Geometry, and Natural Scene image sets. Demographic responses select an in-group face set; remaining face sets supply up to 3 out-group sets. Geometry and Natural Scene subfolders run in sorted order. Each set: 19 ratings (1-7) then 18 preference trials (-3 to +3).

## Repository Structure
- `index.html` - entry point loading jsPsych, plugins, `stimuli.js`, and `experiment.js`.
- `experiment.js` - full timeline logic, data handling, familiar selection, and UI helpers.
- `generate_stimuli.js` - scans `Figure/` recursively and writes `stimuli.js` with `{category, set, label, src}` rows.
- `stimuli.js` - generated stimuli list (do not hand edit).
- `stimuli_manifest.json` - legacy artifact, not used by the current codepath.
- `styles.css` - task styling.
- `Figure/` - image assets:
  - `Face/<Gender-Race-AgeGroup-neutral>/...png`
  - `Geometry/<subfolder>/...png`
  - `Natural_scene/<subfolder>/...jpg`

## Running the Task
1. Install deps (only needed for local server): `npm install`.
2. Regenerate stimuli after adding/changing images: `node generate_stimuli.js`.
3. Serve locally: `npm run serve` (or `npx http-server -c-1`) and open the shown URL.
4. Complete demographics to set the face in-group (gender at birth, race, age range -> young_adult/adult). Category order is randomized each run.

## Experiment Flow (per set)
1. Preview: 19 images, 750 ms each.
2. Rating: same 19 images, slider 1-7, must move slider, click "Click to continue".
3. Familiar selection: 10th-ranked rated image chosen as familiar (fallback to 10th if no data).
4. Preference: 18 novel images paired with familiar, slider -3 to +3, left/right randomized, fixation between trials.

## Data Fields (high level)
- `task`: `rating` or `preference`
- `category_type`: `face` | `geometry` | `natural_scene`
- `category`/`set_label`: specific folder ID (e.g., `Female-white-young_adult-neutral`, `Complex-symmetric`, `Beach`)
- `stimulus_src`, `stimulus_label`
- Rating: `rating`, `response`, `rt`, `utc_start`, `utc_end`
- Preference: `preference`, `familiar_src/label`, `novel_src/label`, `familiar_side`, `novel_side`, `left_*`, `right_*`

## Sharing / Deployment Tips
- Keep `stimuli.js` generated, not hand-edited.
- When adding images, follow folder naming conventions; rerun `node generate_stimuli.js`.
- For Prolific/online use, swap the `on_finish` redirect in `experiment.js` for your completion URL.
- Use version control to track changes; keep this README for collaborators.

## Prolific Deployment (GitHub Pages)

You can host the task on GitHub Pages, but you **cannot store data on GitHub Pages** (it is static hosting only). For Prolific you should:

1. Host your task (you already did):
   - Example: https://cantonsir.github.io/online-f-n-task
2. Save data to a server endpoint (recommended) and then redirect to Prolific completion.

### Option A (simple): Save to Google Sheets via Apps Script

This works well with GitHub Pages because your experiment can `POST` data to a Google Apps Script Web App.

1. Create a Google Sheet (this is where rows will be saved).
2. In Google Drive: New → More → Google Apps Script.
3. Paste this script (replace `SHEET_NAME` if you want):

```javascript
const SHEET_NAME = 'data';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Header row (only once)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'received_at',
        'prolific_pid',
        'study_id',
        'session_id',
        'started_at',
        'finished_at',
        'url',
        'user_agent',
        'data_csv'
      ]);
    }

    sheet.appendRow([
      new Date().toISOString(),
      body.prolific_pid || '',
      body.study_id || '',
      body.session_id || '',
      body.started_at || '',
      body.finished_at || '',
      body.url || '',
      body.user_agent || '',
      body.data_csv || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Deploy: Deploy → New deployment → Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (or “Anyone with the link”)
5. Copy the Web App URL.
6. In `experiment.js`, set:
   - `DATA_SUBMIT_URL` to your Web App URL
   - `PROLIFIC_COMPLETION_CODE` to your Prolific completion code

### Prolific URL parameters

Prolific automatically appends `PROLIFIC_PID`, `STUDY_ID`, `SESSION_ID` to your study URL.
This project reads them and adds them to every trial via `jsPsych.data.addProperties()`.

### Completion redirect

At the end, the task can redirect participants to:

`https://app.prolific.com/submissions/complete?cc=YOUR_CODE`

You can also pass the completion code during testing as a URL param:

`?cc=YOUR_CODE`

