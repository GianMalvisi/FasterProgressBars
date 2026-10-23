function renderBarFrame(element, type, progress) {
    element.style.width = `${progress * 100}%`;

    if (type === 'solid') {
        // Colore solido e piatto, nessun gradiente
        element.style.background = '#2563eb'; 
        element.style.backgroundImage = 'none';
    } 
    else if (type === 'pulsating') {
        // Variazione netta tra azzurro (light blue) e blu scuro (blue) come da paper
        const freq = 1.1 + (1.25 - 1.1) * progress;
        // Seno normalizzato tra 0 e 1
        const sineValue = (Math.sin(progress * Math.PI * 2 * freq * (progress * 5)) + 1) / 2;
        
        // Interpolazione tra Light Blue (173, 216, 230) e Blue scuro (37, 99, 235)
        const r = Math.round(173 + (37 - 173) * sineValue);
        const g = Math.round(216 + (99 - 216) * sineValue);
        const b = Math.round(230 + (235 - 230) * sineValue);
        
        element.style.background = `rgb(${r}, ${g}, ${b})`;
        element.style.backgroundImage = 'none';
    } 
    else if (type === 'ribbed') {
        // Replica fedele della Figura 4: bande verticali sfumate (dark-light-dark)
        const stripes = `repeating-linear-gradient(
            90deg,
            #2563eb 0px,
            #7bb8ef 15px,
            #2563eb 30px
        )`;

        const v0 = 31.3;
        const v1 = 7.8;
        const position = (v0 * progress + 0.5 * (v1 - v0) * progress * progress) * 8;
        
        element.style.background = stripes;
        element.style.backgroundPosition = `${-position}px 0`;
        element.style.backgroundSize = '60px 100%';
    }
}