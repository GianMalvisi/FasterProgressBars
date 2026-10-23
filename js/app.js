document.addEventListener('DOMContentLoaded', () => {
    const setupView = document.getElementById('setup-view');
    const experimentView = document.getElementById('experiment-view');
    const endView = document.getElementById('end-view');
    
    const setupForm = document.getElementById('setup-form');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const errorMsg = document.getElementById('error-msg');
    
    const trialCounter = document.getElementById('trial-counter');
    const durationIndicator = document.getElementById('duration-indicator');
    const instructionText = document.getElementById('instruction-text');
    const controlsContainer = document.getElementById('controls-container');
    const replayBtn = document.getElementById('replay-btn');
    const choiceBtns = document.querySelectorAll('.choice-btn');
    const downloadBtn = document.getElementById('download-btn');

    let participantId = "";
    let trials = [];
    let currentTrialIndex = 0;
    let results = [];
    
    const barTypes = ['solid', 'pulsating', 'ribbed'];
    const durations = [5000, 15000];

    setupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        
        if (!firstName || !lastName) {
            showError("Please fill in both First Name and Last Name.");
            return;
        }

        participantId = `${firstName}_${lastName}`.toLowerCase();
        
        if (localStorage.getItem(`hci_data_${participantId}`)) {
            showError("A session with this name has already been recorded on this device.");
            return;
        }

        errorMsg.style.display = "none";
        initTrials();
        startExperiment();
    });

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.display = "block";
    }

    function initTrials() {
        let generatedTrials = [];
        
        durations.forEach(duration => {
            let durationTrials = [];
            barTypes.forEach(bar1 => {
                barTypes.forEach(bar2 => {
                    durationTrials.push({ bar1, bar2, duration });
                    durationTrials.push({ bar1, bar2, duration });
                });
            });
            shuffleArray(durationTrials);
            generatedTrials = generatedTrials.concat(durationTrials);
        });
        
        trials = generatedTrials;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function startExperiment() {
        setupView.style.display = "none";
        experimentView.style.display = "block";
        currentTrialIndex = 0;
        results = [];
        runCurrentTrial();
    }

    function runCurrentTrial() {
        if (currentTrialIndex >= trials.length) {
            finishExperiment();
            return;
        }

        const trial = trials[currentTrialIndex];
        
        trialCounter.textContent = `Trial: ${currentTrialIndex + 1} / ${trials.length}`;
        durationIndicator.textContent = `Duration: ${trial.duration / 1000}s`;
        instructionText.textContent = "Please watch both progress bars run to completion.";
        controlsContainer.style.display = "none";

        playSequence(trial.bar1, trial.bar2, trial.duration, () => {
            instructionText.textContent = "Please select which progress bar felt faster.";
            controlsContainer.style.display = "block";
        });
    }

    function playSequence(bar1Type, bar2Type, duration, onComplete) {
        const bar1Element = document.getElementById('bar-1');
        const bar2Element = document.getElementById('bar-2');
        
        resetBar(bar1Element);
        resetBar(bar2Element);

        runBar(bar1Element, bar1Type, duration, () => {
            setTimeout(() => {
                runBar(bar2Element, bar2Type, duration, () => {
                    onComplete();
                });
            }, 400);
        });
    }

    function resetBar(element) {
        element.style.width = "0%";
        element.className = "progress-fill";
        element.style.backgroundColor = "#3b82f6";
        element.style.backgroundImage = "none";
    }

    function runBar(element, type, duration, callback) {
        let startTime = null;

        function animationStep(timestamp) {
            if (!startTime) startTime = timestamp;
            let elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / duration, 1.0);

            renderBarFrame(element, type, progress);

            if (progress < 1.0) {
                requestAnimationFrame(animationStep);
            } else {
                if (callback) callback();
            }
        }

        requestAnimationFrame(animationStep);
    }

    choiceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            recordResponse(e.target.getAttribute('data-choice'));
        });
    });

    replayBtn.addEventListener('click', () => {
        runCurrentTrial();
    });

    function recordResponse(choice) {
        const trial = trials[currentTrialIndex];
        
        results.push({
            participantId,
            trialNumber: currentTrialIndex + 1,
            durationMs: trial.duration,
            bar1: trial.bar1,
            bar2: trial.bar2,
            choice
        });

        currentTrialIndex++;
        runCurrentTrial();
    }

    function finishExperiment() {
        experimentView.style.display = "none";
        endView.style.display = "block";
        localStorage.setItem(`hci_data_${participantId}`, JSON.stringify(results));
    }

    downloadBtn.addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ParticipantID,TrialNumber,DurationMs,Bar1,Bar2,Choice\n";

        results.forEach(row => {
            csvContent += `${row.participantId},${row.trialNumber},${row.durationMs},${row.bar1},${row.bar2},${row.choice}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${participantId}_results.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});