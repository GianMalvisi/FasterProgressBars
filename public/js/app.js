document.addEventListener('DOMContentLoaded', () => {
    const setupView = document.getElementById('setup-view');
    const experimentView = document.getElementById('experiment-view');
    const endView = document.getElementById('end-view');
    
    const setupForm = document.getElementById('setup-form');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const ageInput = document.getElementById('age');
    const genderInput = document.getElementById('gender');
    const errorMsg = document.getElementById('error-msg');

    const dobInput = document.getElementById('dob');
    
    // no minors
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    dobInput.max = maxDate.toISOString().split('T')[0];
    
    const trialCounter = document.getElementById('trial-counter');
    const durationIndicator = document.getElementById('duration-indicator');
    const instructionText = document.getElementById('instruction-text');
    const controlsContainer = document.getElementById('controls-container');
    const replayBtn = document.getElementById('replay-btn');
    const choiceBtns = document.querySelectorAll('.choice-btn');
    const saveBtn = document.getElementById('save-btn');

    const consentCheck = document.getElementById('consent-check');
    const consentModal = document.getElementById('consent-modal');
    const acceptConsentBtn = document.getElementById('accept-consent-btn');

    let participantInfo = {};
    let trials = [];
    let currentTrialIndex = 0;
    let results = [];
    
    const barTypes = ['solid', 'pulsating', 'ribbed'];
    const durations = [5000, 15000];

    consentCheck.addEventListener('click', (e) => {
        if (consentCheck.checked) {
            e.preventDefault(); 
            consentModal.style.display = "flex";
        }
    });

    acceptConsentBtn.addEventListener('click', () => {
        consentCheck.checked = true;
        consentModal.style.display = "none";
    });

    setupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const dobValue = dobInput.value;
        const gender = genderInput.value;
        
        if (!firstName || !lastName || !dobValue || !gender) {
            showError("Please fill in all fields correctly.");
            return;
        }

        if (!consentCheck.checked) {
            showError("You must read and agree to the experiment rules.");
            return;
        }

        // Calculate age
        const dobDate = new Date(dobValue);
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            age--;
        }

        participantInfo = { firstName, lastName, age, gender };
        
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
        const barAElement = document.getElementById('bar-a');
        const barBElement = document.getElementById('bar-b');
        
        if (!barAElement || !barBElement) return;

        resetBar(barAElement);
        resetBar(barBElement);

        runBar(barAElement, bar1Type, duration, () => {
            setTimeout(() => {
                runBar(barBElement, bar2Type, duration, () => {
                    onComplete();
                });
            }, 400);
        });
    }

    function resetBar(element) {
        element.style.width = "0%";
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
            trialNumber: currentTrialIndex + 1,
            durationMs: trial.duration,
            barA: trial.bar1,
            barB: trial.bar2,
            choice: choice
        });

        currentTrialIndex++;
        runCurrentTrial();
    }

    function finishExperiment() {
        experimentView.style.display = "none";
        endView.style.display = "block";
        localStorage.setItem(`backup_${participantInfo.firstName}_${participantInfo.lastName}`, JSON.stringify(results));
    }

    saveBtn.addEventListener('click', () => {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving to Database...";

        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantInfo: participantInfo,
                trialsData: results
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                saveBtn.textContent = "Results Saved Successfully!";
                saveBtn.style.backgroundColor = "#10b981"; // Success
            } else {
                throw new Error(data.error || "Unknown error occurred");
            }
        })
        .catch(error => {
            console.error('Error saving data:', error);
            saveBtn.disabled = false;
            saveBtn.textContent = "Error! Try Saving Again";
            saveBtn.style.backgroundColor = "#ef4444"; // Error
        });
    });
});