# jsPsych Multi-Category Preference Task

![jsPsych](https://img.shields.io/badge/jsPsych-8.2.2-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

A professional, browser-based behavioral experiment designed to measure rating and preference judgments across various image categories, including **Face**, **Geometry**, and **Natural Scene** sets.

## 🌟 Overview

This experiment is built with **jsPsych** and optimized for online data collection platforms like **Prolific**. It features a dynamic stimuli selection system that adjusts based on participant demographics (in-group vs. out-group face sets) and follows a structured flow of rating and preference trials.

## 🚀 Key Features

- **Multi-Category Stimuli**: Supports Face (demographic-linked), Geometric shapes, and Natural Scenes.
- **Adaptive In-Grouping**: Automated selection of "in-group" face sets based on age, race, and gender responses.
- **Dual-Phase Methodology**:
  - **Rating Phase**: Participants rate 19 images on a 1-7 Likert scale.
  - **Preference Phase**: Measures preference judgments (-3 to +3) between a familiar stimulus (10th-ranked) and novel stimuli.
- **Seamless Prolific Integration**: Automatically captures `PROLIFIC_PID`, `STUDY_ID`, and `SESSION_ID` from URL parameters.
- **Scalable Data Backend**: Pre-configured to work with Google Sheets via Google Apps Script for easy data storage.

## 📂 Repository Structure

```text
├── index.html          # Main entry point; loads jsPsych and core assets
├── experiment.js       # Core timeline logic, randomization, and UI helpers
├── questionnaires.js   # Definition of demographic and psychological surveys
├── stimuli.js          # Auto-generated manifest of image assets
├── generate_stimuli.js # Utility script to sync local images with stimuli.js
├── styles.css          # Custom styling for the experiment interface
└── Figure/             # Directory containing experimental stimuli
    ├── Face/           # Demographic-categorized face images
    ├── Geometry/       # Geometric pattern sets
    └── Natural_scene/  # Environmental/Scene image sets
```

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- `npm` (usually included with Node.js)

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Sync Stimuli**:
   If you add or remove images from the `Figure/` directory, update the manifest:
   ```bash
   node generate_stimuli.js
   ```

3. **Run Locally**:
   Start a local server to view the experiment:
   ```bash
   npm run serve
   ```
   Open the provided URL (typically `http://localhost:8080`) in your browser.

## 🌐 Deployment & Data Collection

### 1. Hosting (GitHub Pages)
The task is ready to be hosted as a static site. Simply enable **GitHub Pages** in your repository settings.

### 2. Data Storage (Google Sheets Integration)
Since GitHub Pages is static, you can use Google Apps Script as a lightweight backend:
- Create a Google Sheet and an Apps Script.
- Deploy the script as a **Web App** (Access: "Anyone").
- Set `DATA_SUBMIT_URL` in `experiment.js` to your script URL.

### 3. Prolific Setup
Update the `PROLIFIC_COMPLETION_CODE` in `experiment.js` to ensure participants are redirected correctly after completion.

## 📊 Data Output

The experiment generates detailed CSV-ready data for each trial:
- `task`: `rating` or `preference`
- `category_type`: Image category (e.g., `face`, `geometry`)
- `stimulus_label`: Identifier for the specific image.
- `response`: The participant's rating or preference score.
- `rt`: Reaction time in milliseconds.
- `metadata`: Automatically captured Prolific IDs and session timing.

## 📄 License
This project is licensed under the MIT License - see the `LICENSE` file for details.
