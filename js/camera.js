const elements = {
    video: document.getElementById('camera-stream'),
    canvas: document.getElementById('camera-canvas'),
    captureButton: document.getElementById('capture-photo-btn'),
    cameraContainer: document.getElementById('camera-container'),
};

let stream = null;

/**
 * Starts the camera and displays the video stream.
 * @returns {Promise<boolean>} True if the camera started successfully, false otherwise.
 */
export async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API is not supported in this browser.");
        return false;
    }
    try {
        // Request a higher resolution from the camera if possible
        const constraints = { 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 } 
            } 
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.video.srcObject = stream;
        elements.cameraContainer.style.display = 'block';
        return true;
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access the camera. Please ensure you have a camera connected and have granted permission.");
        return false;
    }
}

/**
 * Stops the camera stream.
 */
export function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    elements.cameraContainer.style.display = 'none';
}

/**
 * Captures a photo from the video stream and returns it as a Base64 data URL.
 * The image is resized to a max width of 1920px to conserve storage space.
 * @returns {string} The Base64 data URL of the captured image.
 */
export function capturePhoto() {
    // --- CHANGE 1: Increased Resolution ---
    const MAX_WIDTH = 1920; // Increased from 800 for better clarity

    const scale = MAX_WIDTH / elements.video.videoWidth;
    elements.canvas.width = MAX_WIDTH;
    elements.canvas.height = elements.video.videoHeight * scale;
    const context = elements.canvas.getContext('2d');
    context.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
    stopCamera();

    // --- CHANGE 2: Increased JPEG Quality ---
    // Increased from 0.8 to 0.95 for less compression artifacting
    return elements.canvas.toDataURL('image/jpeg', 0.95); 
}
