# Faster Progress Bars: Replication Study

A replication of **Study 3** from:

> Harrison, C., Yeo, Z., & Hudson, S. E. (2010). *Faster progress bars: manipulating perceived duration with visual augmentations.* In Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '10), pp. 1545–1548. ACM.

Developed as part of the Research Methods coursework at Queen Mary University of London.

## Overview

The experiment investigates whether visual augmentations applied to progress bars can manipulate users' perceived duration without changing the actual execution time. Participants watch pairs of 5-second and 15-second progress bars and judge which one felt faster in a forced-choice pairwise comparison.

Three progress bar conditions are compared:

| Condition | Description |
|-----------|-------------|
| **Solid** (control) | Standard solid-color progress bar |
| **Pulsating** (Fast Increasing) | Sinusoidal color oscillation from 1.1 Hz to 1.25 Hz |
| **Ribbed** (Backwards Decelerating) | Animated ribbing moving opposite to progress direction, decelerating from −31.3 mm/s to −7.8 mm/s |

Each participant completes **36 trials** (all 9 distinct ordered pairs × 2 orderings × 2 durations), including control pairs where both bars use the same behavior.

## Architecture

```
┌─────────────────────────────┐
│   Browser (SPA)             │
│   index.html + app.js       │──── POST /api/save ────┐
│   animations.js + style.css │                         │
└─────────────────────────────┘                         ▼
                                              ┌─────────────────┐
                                              │  Express Server  │
                                              │  (server.js)     │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  MySQL/MariaDB   │
                                              │  hci_experiment  │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  export.py       │
                                              │  → .csv + .xlsx  │
                                              └─────────────────┘
```

- **Frontend** — Vanilla HTML/CSS/JS single-page application handling trial randomization, progress bar animations, and participant input.
- **Backend** — Node.js + Express server that persists trial responses to a MySQL/MariaDB database via transactional inserts.
- **Export pipeline** — Python script that queries the database, normalizes trial data into canonical pairs, computes mean preference scores, runs two-sided sign tests, and exports results to CSV and Excel.

## Prerequisites

- **Node.js** (v16+)
- **MySQL** or **MariaDB**
- **Python 3.8+**
- A modern desktop browser supporting `requestAnimationFrame`
- For consistent results, all participants should use the same monitor and screen resolution

## Setup

### 1. Database

```bash
mysql -u root -p < schema.sql
```

This creates the `hci_experiment` database with `participants` and `trials` tables. Update the credentials in `server.js` and `export.py` if your setup differs from the default (`root` / `admin`).

### 2. Backend

```bash
npm install express mysql2
node server.js
```

The server starts at `http://localhost:3000` and serves the frontend statically.

### 3. Running the experiment

Open `http://localhost:3000` in a browser. Each participant enters their details, completes the 36 trials, and responses are automatically saved to the database.

### 4. Exporting data

```bash
pip install -r requirements.txt
python export.py
```

Outputs are saved to the `exports/` directory:
- `raw_trials.csv` — All individual trial records with normalized canonical pairs and preference scores
- `data_analysis.xlsx` — Three sheets:
  - **data_summary** — Aggregated win/loss/tie counts, mean preference scores, and sign test p-values per comparison per duration (5s, 15s, combined)
  - **Per_Participant** — Mean preference scores broken down by participant and duration
  - **Raw_Normalized** — Full trial-level data with canonical pair mapping and preference scores

## Repository Structure

```
├── public/
│   ├── index.html          # Experiment interface
│   ├── css/style.css       # UI styling
│   └── js/
│       ├── app.js          # Trial state machine, randomization, data collection
│       └── animations.js   # Pulsating and ribbed animation engines
├── server.js               # Express backend with MySQL integration
├── schema.sql              # Database schema (participants + trials tables)
├── export.py               # Data export and statistical analysis pipeline
├── requirements.txt        # Python dependencies (pandas, scipy, openpyxl, pymysql)
├── .gitignore
└── LICENSE                 # MIT
```

## Statistical Method

Following the original paper, a **simple preference metric** is computed for each comparison:

- **+1** if Bar 1 (the augmented bar) is perceived as faster
- **−1** if Bar 2 is perceived as faster
- **0** if perceived as equal

The mean preference score across all trials is computed per comparison. Statistical significance is assessed using a **two-sided sign test** (excluding ties), consistent with the original study's methodology.

## License

MIT