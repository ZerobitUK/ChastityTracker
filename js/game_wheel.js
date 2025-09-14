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

        // This transform creates the wedge shape for the segment
        const rotation = segmentAngle * index;
        segment.style.transform = `rotate(${rotation}deg)`;

        // Create a separate content element for the text
        const content = document.createElement('div');
        content.classList.add('wheel-segment-content');
        content.textContent = outcome.text;
        
        // This transform rotates the text itself to be horizontal
        // It calculates the center of the segment and then rotates the text back
        const textRotation = -90 + (segmentAngle / 2);
        content.style.transform = `rotate(${textRotation}deg)`;

        segment.appendChild(content);
        wheelEl.appendChild(segment);
    });
}

function spin() {
    spinButton.disabled = true;
    backButton.style.display = 'none';
    const winningSegmentIndex = Math.floor(Math.random() * segmentCount);
    // Adjust rotation to align the pointer with the middle of the segment
    const rotation = (360 - (winningSegmentIndex * segmentAngle)) - (segmentAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const finalAngle = rotation + (360 * fullSpins);
    wheelEl.style.transform = `rotate(${finalAngle}deg)`;

    setTimeout(() => {
        const winningOutcome = WHEEL_OUTCOMES[winningSegmentIndex];
        backButton.style.display = 'block';
        onSpinComplete(winningOutcome);
    }, 5500); // Wait for spin animation to finish
}

export function initWheel(spinCallback) {
    onSpinComplete = spinCallback;
    setupWheel();
    spinButton.disabled = false;
    backButton.style.display = 'none';
    
    // Reset the wheel's rotation instantly before setting the transition
    wheelEl.style.transition = 'none';
    wheelEl.style.transform = 'rotate(0deg)';
    
    // Use a tiny timeout to ensure the transition is applied after the reset
    setTimeout(() => {
        wheelEl.style.transition = 'transform 5s cubic-bezier(0.25, 1, 0.5, 1)';
    }, 50);

    // Use a fresh event listener to prevent multiple spins
    const spinHandler = () => {
        spin();
        spinButton.removeEventListener('click', spinHandler);
    };
    spinButton.removeEventListener('click', spin); // Clean up any old listeners
    spinButton.addEventListener('click', spinHandler);
}
