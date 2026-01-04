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
