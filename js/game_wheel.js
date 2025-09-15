import { WHEEL_OUTCOMES } from './constants.js';

const wheelEl = document.getElementById('wheel');
const spinButton = document.getElementById('spin-button');
const backButton = document.getElementById('wheel-back-btn');

let onSpinComplete;
const segmentCount = WHEEL_OUTCOMES.length;
const segmentAngle = 360 / segmentCount;

function setupWheel() {
    wheelEl.innerHTML = ''; // Clear previous wheel
    WHEEL_OUTCOMES.forEach((outcome, index) => {
        const rotation = segmentAngle * index;

        // Create a container for the spoke and its text
        const container = document.createElement('div');
        container.classList.add('wheel-spoke-container');
        container.style.transform = `rotate(${rotation}deg)`;

        // Create the visual line for the spoke
        const line = document.createElement('div');
        line.classList.add('wheel-spoke-line');

        // Create the text element
        const text = document.createElement('div');
        text.classList.add('wheel-spoke-text');
        text.textContent = outcome.text;
        
        // Counter-rotate the text to keep it horizontal
        text.style.transform = `translateX(-50%) rotate(${-rotation}deg)`;

        container.appendChild(line);
        container.appendChild(text);
        wheelEl.appendChild(container);
    });
}

function spin() {
    spinButton.disabled = true;
    backButton.style.display = 'none';
    const winningSegmentIndex = Math.floor(Math.random() * segmentCount);
    
    // The pointer is on the right (0 degrees), so we calculate the spin to align the winner
    const targetRotation = -(winningSegmentIndex * segmentAngle);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const finalAngle = targetRotation + (360 * fullSpins);

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
    
    // Ensure old listeners are cleared before adding a new one
    const newSpinButton = spinButton.cloneNode(true);
    spinButton.parentNode.replaceChild(newSpinButton, spinButton);
    newSpinButton.addEventListener('click', spinHandler);
    
    // Re-assign the global spinButton variable to the new button
    window.spinButton = newSpinButton;
}
