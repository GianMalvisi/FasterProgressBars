# Faster Progress Bars: Replication Study

This repository contains the experimental setup and source code for the replication of **Study 3** from the paper: 
> *Harrison, C., Yeo, Z., & Hudson, S. E. (2010). Faster progress bars: manipulating perceived duration with visual augmentations. In Proceedings of the SIGCHI Conference on Human Factors in Computing Systems.*

This project was developed as part of the Research Methods coursework at Queen Mary University of London.

## 🎯 Overview
The experiment investigates whether visual augmentations can manipulate the perceived duration of a progress bar without altering its actual execution time. We built a custom Single Page Application (SPA) to conduct a pairwise preference test comparing three conditions across 5-second and 15-second intervals:
1. **Solid Control:** Standard solid-color progress bar.
2. **Pulsating (Fast Increasing):** Color frequency oscillating from 1.1 Hz to 1.25 Hz.
3. **Ribbed (Backwards Decelerating):** Ribbed background moving backwards, decelerating from -31.3 mm/s to -7.8 mm/s.

## Environment Setup & Requirements
This application is built using Vanilla HTML, CSS, and JavaScript. It does not require a backend or database, making it highly portable. 
- **Browser:** A modern web browser supporting requestAnimationFrame running on a Desktop environment.
- **Screen:** For consistent visual rendering, the experiment should be run on the same monitor for all participants.


## 📊 Data Collection & Export
To ensure data privacy and ease of setup, all trial responses are temporarily stored in the browser's localStorage during the experiment. 
Upon completion of the 36 trials, the application automatically aggregates the data and prompts a download of a .csv file containing the participant's ID, trial conditions, ordering, and selected preference.

## 📁 Repository Structure
- `/css` - Stylesheets defining the UI and static visual elements.
- `/js` - Logic for trial randomization, state machine, animation engines, and CSV export.
- `index.html` - The main experimental interface.
