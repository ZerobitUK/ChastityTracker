const sounds = {
    win: document.getElementById('sound-win'),
    lose: document.getElementById('sound-lose'),
    spin: document.getElementById('sound-spin'),
    flip: document.getElementById('sound-flip'),
};

let isMuted = localStorage.getItem('chastity_sound_muted') === 'true';

const soundToggleButton = document.getElementById('sound-toggle-btn');
updateMuteButton();

export function playSound(soundName, volume = 1.0) {
    if (isMuted) return;
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.volume = volume;
        sound.play().catch(e => console.error("Sound playback failed:", e));
    }
}

export function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('chastity_sound_muted', isMuted);
    updateMuteButton();
}

function updateMuteButton() {
    if (soundToggleButton) {
        soundToggleButton.textContent = isMuted ? '🔇' : '🔊';
    }
}
