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
    const rotation = (360 - (winningSegmentIndex * segmentAngle)) - (segmentAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const finalAngle = rotation + (360 * fullSpins);
    wheelEl.style.transform = `rotate(${finalAngle}deg)`;

    setTimeout(() => {
        const winningOutcome = WHEEL_OUTCOMES[winningSegmentIndex];
        backButton.style.display = 'block';
        onSpinComplete(winningOutcome);
    }, 5500);
}

export function initWheel(spinCallback) {
    onSpinComplete = spinCallback;
    setupWheel();
    spinButton.disabled = false;
    backButton.style.display = 'none';
    wheelEl.style.transition = 'none';
    wheelEl.style.transform = 'rotate(0deg)';
    setTimeout(() => {
        wheelEl.style.transition = 'transform 5s cubic-bezier(0.25, 1, 0.5, 1)';
    }, 50);

    const spinHandler = () => {
        spin();
        spinButton.removeEventListener('click', spinHandler);
    };
    spinButton.removeEventListener('click', spin);
    spinButton.addEventListener('click', spinHandler);
}
