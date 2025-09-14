import { WHEEL_OUTCOMES } from './constants.js';

const wheelEl = document.getElementById('wheel');
const spinButton = document.getElementById('spin-button');
const backButton = document.getElementById('wheel-back-btn');

let onSpinComplete;
const segmentCount = WHEEL_OUTCOMES.length;
const segmentAngle = 360 / segmentCount;

function setupWheel() {
    wheelEl.innerHTML = '';
    WHEEL_OUTCOMES.forEach((outcome, index) => {
        const segment = document.createElement('div');
        segment.classList.add('wheel-segment');
        segment.textContent = outcome.text;
        segment.style.transform = `rotate(${segmentAngle * index + segmentAngle / 2}deg)`;
        wheelEl.appendChild(segment);
    });
}

function spin() {
    spinButton.disabled = true;
    backButton.style.display = 'none';
    const winningSegmentIndex = Math.floor(Math.random() * segmentCount);
    const winningAngle = (360 - (winningSegmentIndex * segmentAngle)) - (segmentAngle / 2);
    const randomSpins = 5 + Math.random() * 5; // Spin at least 5 times
    
    wheelEl.style.transform = `rotate(${winningAngle + 360 * randomSpins}deg)`;

    setTimeout(() => {
        const winningOutcome = WHEEL_OUTCOMES[winningSegmentIndex];
        spinButton.disabled = false;
        backButton.style.display = 'block';
        onSpinComplete(winningOutcome);
    }, 5500); // Wait for spin animation to finish
}

export function initWheel(spinCallback) {
    onSpinComplete = spinCallback;
    setupWheel();
    spinButton.removeEventListener('click', spin); // Prevent multiple listeners
    spinButton.addEventListener('click', spin);
}
