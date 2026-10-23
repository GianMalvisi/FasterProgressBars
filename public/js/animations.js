function renderBarFrame(element, type, progress, durationSec) {
    element.style.width = `${progress * 100}%`;

    if (type === 'solid') {
        element.style.background = '#2563eb'; 
        element.style.backgroundImage = 'none';
    } 
    else if (type === 'pulsating') {
        const f0 = 1.1;
        const f1 = 1.25;
        
        const phase = Math.PI * 2 * durationSec * (f0 * progress + 0.5 * (f1 - f0) * progress * progress);
        const sineValue = (Math.sin(phase) + 1) / 2;
        
        const r = Math.round(173 + (37 - 173) * sineValue);
        const g = Math.round(216 + (99 - 216) * sineValue);
        const b = Math.round(230 + (235 - 230) * sineValue);
        
        element.style.background = `rgb(${r}, ${g}, ${b})`;
        element.style.backgroundImage = 'none';
    } 
    else if (type === 'ribbed') {
        const stripes = `repeating-linear-gradient(
            90deg,
            #2563eb 0px,
            #7bb8ef 15px,
            #2563eb 30px
        )`;

        const v0 = 31.3;
        const v1 = 7.8;
        
        const position = durationSec * (v0 * progress + 0.5 * (v1 - v0) * progress * progress) * 3.8;        
        
        element.style.background = stripes;
        element.style.backgroundPosition = `${-position}px 0`;
        element.style.backgroundSize = '60px 100%';
    }
}