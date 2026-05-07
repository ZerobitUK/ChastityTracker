import { showModal } from './ui.js'; // Requires showModal export from ui.js

const elements = {
    video: document.getElementById('camera-stream'),
    canvas: document.getElementById('camera-canvas'),
    captureButton: document.getElementById('capture-photo-btn'),
    cameraContainer: document.getElementById('camera-container'),
};

let stream = null;

// Graceful fallback if showModal isn't strictly defined in ui.js yet
function displayError(title, message) {
    if (typeof showModal === 'function') {
        showModal(title, message);
    } else {
        alert(`${title}\n\n${message}`);
    }
}

export async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        displayError("Camera API Not Supported", "Your browser does not support camera access or it is disabled. If you are on mobile, please check your site settings.");
        return false;
    }
    try {
        const constraints = { 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 }, // Optimized for storage
                height: { ideal: 720 } 
            } 
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.video.srcObject = stream;
        elements.cameraContainer.style.display = 'block';
        return true;
    } catch (err) {
        console.error("Error accessing camera:", err);
        displayError("Camera Permission Denied", "We need camera access to capture your check-in. Please explicitly allow camera permissions in your browser's site settings, refresh the page, and try again.");
        return false;
    }
}

export function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    elements.cameraContainer.style.display = 'none';
}

export function capturePhoto() {
    const MAX_WIDTH = 1280; 
    const scale = MAX_WIDTH / elements.video.videoWidth;
    elements.canvas.width = MAX_WIDTH;
    elements.canvas.height = elements.video.videoHeight * scale;
    const context = elements.canvas.getContext('2d');
    context.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
    stopCamera();
    return elements.canvas.toDataURL('image/jpeg', 0.7); // 70% Quality
}
