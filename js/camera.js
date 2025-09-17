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
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
 * The image is resized to a max width of 800px to conserve storage space.
 * @returns {string} The Base64 data URL of the captured image.
 */
export function capturePhoto() {
    const MAX_WIDTH = 1280;
    const scale = MAX_WIDTH / elements.video.videoWidth;
    elements.canvas.width = MAX_WIDTH;
    elements.canvas.height = elements.video.videoHeight * scale;
    const context = elements.canvas.getContext('2d');
    context.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
    stopCamera();
    return elements.canvas.toDataURL('image/jpeg', 0.95); // Use JPEG for smaller file size
}
