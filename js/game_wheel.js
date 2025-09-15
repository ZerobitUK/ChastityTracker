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

        // This transform rotates the segment into its correct position on the wheel
        const rotation = segmentAngle * index;
        segment.style.transform = `rotate(${rotation}deg) skewY(-${90 - segmentAngle}deg)`;
        
        // Create a span for the text and apply counter-rotation to make it horizontal
        const textSpan = document.createElement('span');
        textSpan.textContent = outcome.text;
        // The skewY transform on the segment makes the "top" of the segment appear slanted.
        // We need to apply a counter-skew to the text, and then rotate it to be horizontal.
        // The 90 degree rotation is because the segment itself is a quarter-circle (90 deg) before skew.
        // The segmentAngle / 2 offsets it to the center of the segment for horizontal text.
        textSpan.style.transform = `skewY(${90 - segmentAngle}deg) rotate(${90 + (segmentAngle / 2)}deg)`;
        textSpan.style.transformOrigin = '0 50%'; // Pivot point for the text rotation
        textSpan.style.position = 'absolute'; // Position within the segment
        textSpan.style.left = 'calc(50% + 20px)'; // Adjust position to be further out
        textSpan.style.whiteSpace = 'nowrap'; // Prevent text from wrapping

        segment.appendChild(textSpan);
        wheelEl.appendChild(segment);
    });
}

function spin() {
    spinButton.disabled = true;
    backButton.style.display = 'none';
    const winningSegmentIndex = Math.floor(Math.random() * segmentCount);
    
    // Calculate the target rotation to land the pointer on the winning segment.
    // We add extra full spins to make it visually appealing.
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full spins
    const targetRotation = (360 - (winningSegmentIndex * segmentAngle)) + (segmentAngle / 2); // Center the segment under the pointer
    const finalAngle = targetRotation + (360 * fullSpins);

    wheelEl.style.transform = `rotate(${finalAngle}deg)`;

    setTimeout(() => {
        const winningOutcome = WHEEL_OUTCOMES[winningSegmentIndex];
        backButton.style.display = 'block';
        onSpinComplete(winningOutcome);
    }, 5500); // Wait for spin animation (5s) + a small buffer (0.5s)
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
    }, 50); // Small delay to allow browser to register the 'none' before applying the transition

    // Use a fresh event listener to prevent multiple spins from accumulating
    const spinHandler = () => {
        spin();
        // Remove this specific handler after it's triggered to prevent re-attaching
        spinButton.removeEventListener('click', spinHandler); 
    };
    // Ensure any old spin handlers are removed before adding a new one for clarity
    spinButton.removeEventListener('click', spin); // This handles cases where spin was attached directly
    spinButton.addEventListener('click', spinHandler);
}
