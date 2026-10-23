function renderBarFrame(element, type, progress) {
    element.style.width = `${progress * 100}%`;

    if (type === 'solid') {
        element.style.background = 'linear-gradient(to bottom, #72aee6 0%, #3b82f6 50%, #1d4ed8 100%)';
        element.style.backgroundImage = 'linear-gradient(to bottom, #72aee6 0%, #3b82f6 50%, #1d4ed8 100%)';
    } 
    else if (type === 'pulsating') {
        const freq = 1.1 + (1.25 - 1.1) * progress;
        const alpha = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2 * freq * (progress * 5));
        element.style.background = `linear-gradient(to bottom, rgba(114, 174, 230, ${alpha}) 0%, rgba(59, 130, 246, ${alpha}) 50%, rgba(29, 78, 216, ${alpha}) 100%)`;
    } 
    else if (type === 'ribbed') {
        // Backwards Decelerating Ribbed bar (Mac OS X Aqua Style replica)
        const currentVelocity = 31.3 * (1 - progress) + 7.8 * progress;
        const bgPosition = -(progress * currentVelocity * 15) % 24;

        // Using repeating linear gradient with sharp highlights and shadows to simulate 3D glossy ribs
        element.style.background = `
            repeating-linear-gradient(
                90deg,
                rgba(0, 0, 0, 0.15) 0px,
                rgba(0, 0, 0, 0.15) 3px,
                rgba(255, 255, 255, 0.4) 3px,
                rgba(255, 255, 255, 0.4) 6px,
                transparent 6px,
                transparent 12px
            ),
            linear-gradient(to bottom, #72aee6 0%, #3b82f6 50%, #1d4ed8 100%)
        `;
        element.style.backgroundSize = '24px 100%, 100% 100%';
        element.style.backgroundPosition = `${bgPosition}px 0, 0 0`;
    }
}