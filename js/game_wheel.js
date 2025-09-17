import { WHEEL_OUTCOMES } from './constants.js';

const wheelEl = document.getElementById('wheel');
const spinButton = document.getElementById('spin-button');
const backButton = document.getElementById('wheel-back-btn');

let onSpinComplete;
let currentOutcomes = [];

function setupWheel() {
    wheelEl.innerHTML = '';
    const segmentCount = currentOutcomes.length;
    const segmentAngle = 360 / segmentCount;

    currentOutcomes.forEach((outcome, index) => {
        const rotation = segmentAngle * index;

        const container = document.createElement('div');
        container.classList.add('wheel-spoke-container');
        container.style.transform = `rotate(${rotation}deg)`;

        const line = document.createElement('div');
        line.classList.add('wheel-spoke-line');

        const text = document.createElement('div');
        text.classList.add('wheel-spoke-text');
        text.textContent = outcome.text;

        if (outcome.type === 'double') {
            text.classList.add('double-or-nothing');
        }

        container.appendChild(line);
        container.appendChild(text);
        wheelEl.appendChild(container);
    });
}

function spin() {
    spinButton.disabled = true;
    backButton.style.display = 'none';
    
    const segmentCount = currentOutcomes.length;
    const segmentAngle = 360 / segmentCount;
    const winningSegmentIndex = Math.floor(Math.random() * segmentCount);

    const targetRotation = -(winningSegmentIndex * segmentAngle);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const finalAngle = targetRotation + (360 * fullSpins);

    wheelEl.style.transform = `rotate(${finalAngle}deg)`;

    setTimeout(() => {
        const winningOutcome = currentOutcomes[winningSegmentIndex];
        backButton.style.display = 'block';
        onSpinComplete(winningOutcome);
    }, 5500);
}

export function initWheel(spinCallback, outcomes = null) {
    onSpinComplete = spinCallback;
    currentOutcomes = outcomes || WHEEL_OUTCOMES;
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
    spinButton.addEventListener('click', spinHandler);
}
