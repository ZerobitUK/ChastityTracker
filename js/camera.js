const elements = {
    video: document.getElementById('camera-stream'),
    canvas: document.getElementById('camera-canvas'),
    captureButton: document.getElementById('capture-photo-btn'),
    cameraContainer: document.getElementById('camera-container'),
};

let stream = null;

export async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API is not supported.");
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
        alert("Could not access camera.");
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
