import { WHEEL_OUTCOMES } from './constants.js';

const wheelEl = document.getElementById('wheel');
const spinButton = document.getElementById('spin-button');
const backButton = document.getElementById('wheel-back-btn');

let onSpinComplete;
let currentOutcomes = [];

// Base palette for alternating slice colours
const SLICE_COLORS = ['#2c3e50', '#34495e', '#1a252f', '#3b5998', '#2980b9'];
const DOUBLE_COLOR = '#8e44ad';

function setupWheel() {
    wheelEl.innerHTML = '';
    const segmentCount = currentOutcomes.length;
    const segmentAngle = 360 / segmentCount;

    let gradientString = [];
    let currentAngle = 0;

    currentOutcomes.forEach((outcome, index) => {
        // Build the conic-gradient segment
        const color = outcome.type === 'double' ? DOUBLE_COLOR : SLICE_COLORS[index % SLICE_COLORS.length];
        const nextAngle = currentAngle + segmentAngle;
        gradientString.push(`${color} ${currentAngle}deg ${nextAngle}deg`);

        // Center the text perfectly in the middle of the slice
        const textRotation = currentAngle + (segmentAngle / 2);

        const container = document.createElement('div');
        container.classList.add('wheel-spoke-container');
        container.style.transform = `rotate(${textRotation}deg)`;

        const text = document.createElement('div');
        text.classList.add('wheel-spoke-text');
        text.textContent = outcome.text;

        if (outcome.type === 'double') {
            text.classList.add('double-or-nothing');
        }

        container.appendChild(text);
        wheelEl.appendChild(container);

        currentAngle = nextAngle;
    });

    // Apply the arcade-style gradient
    wheelEl.style.background = `conic-gradient(${gradientString.join(', ')})`;
}

function spin() {
    spinButton.disabled = true;
    backButton.style.display = 'none';
    
    const segmentCount = currentOutcomes.length;
    const segmentAngle = 360 / segmentCount;
    const winningSegmentIndex = Math.floor(Math.random() * segmentCount);

    // Adjust target rotation to align the slice center with the pointer
    const targetRotation = -(winningSegmentIndex * segmentAngle) - (segmentAngle / 2);
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
