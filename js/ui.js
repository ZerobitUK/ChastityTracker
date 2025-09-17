import * as sounds from './sounds.js';

const elements = {
    timerScreen: document.getElementById('timer-screen'),
    gameScreen: document.getElementById('game-screen'),
    timer: document.getElementById('timer'),
    timerMessage: document.getElementById('timer-message'),
    lockdownTimer: document.getElementById('lockdown-timer'),
    doubledPenaltyTimer: document.getElementById('doubled-penalty-timer'),
    startDate: document.getElementById('startDate'),
    timerOptions: document.getElementById('timer-options'),
    startButton: document.getElementById('start-button'),
    startLocktoberButton: document.getElementById('start-locktober-button'),
    unlockButton: document.getElementById('unlock-button'),
    resetButton: document.getElementById('reset-button'),
    pinDisplay: document.getElementById('pin-display'),
    pinCode: document.getElementById('pin-code'),
    photoDisplay: document.getElementById('photo-display'),
    historyContainer: document.getElementById('history-container'),
    quoteBanner: document.getElementById('quote-banner'),
    modalContainer: document.getElementById('modal-container'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalConfirmBtn: document.getElementById('modal-confirm-btn'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    practiceGamesPanel: document.getElementById('practice-games-panel'),
    notesModalContainer: document.getElementById('notes-modal-container'),
    notesModalTextarea: document.getElementById('notes-modal-textarea'),
    notesModalSaveBtn: document.getElementById('notes-modal-save-btn'),
    notesModalCloseBtn: document.getElementById('notes-modal-close-btn'),
    revealPinBtn: document.getElementById('reveal-pin-btn'),
    keyholderEmailBtn: document.getElementById('keyholder-email-btn'),
    edgePointsDisplay: document.getElementById('edge-points-display'), // <-- NEW
    edgeOptionsContainer: document.getElementById('edge-options-container'), // <-- NEW
    edgeOptionNudge: document.getElementById('edge-option-nudge'), // <-- NEW
    edgeOptionCalibrate: document.getElementById('edge-option-calibrate'), // <-- NEW
};

let confirmCallback = null;
let cancelCallback = null;

let currentNotesIndex = null;
let saveNotesCallback = null;


elements.modalCloseBtn.addEventListener('click', () => {
    if (typeof cancelCallback === 'function') {
        cancelCallback();
    }
    else if (elements.modalConfirmBtn.style.display === 'none' && typeof confirmCallback === 'function') {
        confirmCallback();
    }
    closeModal();
});

elements.modalConfirmBtn.addEventListener('click', () => {
    if (typeof confirmCallback === 'function') {
        confirmCallback();
    }
    closeModal();
});

function closeModal() {
    elements.modalContainer.classList.remove('visible');
    confirmCallback = null;
    cancelCallback = null;
}

// --- Notes Modal Logic ---

export function setupNotesModal(saveCallback) {
    saveNotesCallback = saveCallback;
    elements.notesModalSaveBtn.addEventListener('click', () => {
        if (currentNotesIndex !== null) {
            saveNotesCallback(currentNotesIndex, elements.notesModalTextarea.value);
        }
        closeNotesModal();
    });
    elements.notesModalCloseBtn.addEventListener('click', closeNotesModal);
}

export function showNotesModal(index, currentText) {
    currentNotesIndex = index;
    elements.notesModalTextarea.value = currentText;
    elements.notesModalContainer.classList.add('visible');
}

function closeNotesModal() {
    elements.notesModalContainer.classList.remove('visible');
    currentNotesIndex = null;
}


export function showModal(title, message, showConfirm = false, onConfirm = null, onCancel = null) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.modalConfirmBtn.style.display = showConfirm ? 'block' : 'none';
    elements.modalCloseBtn.textContent = showConfirm ? 'Decline' : 'Close';
    elements.modalContainer.classList.add('visible');
    confirmCallback = onConfirm;
    cancelCallback = onCancel;
}

export function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}

export function updateTimerDisplay(durationMs) {
    const safeDuration = Math.max(0, durationMs);
    const days = Math.floor(safeDuration / (1000 * 60 * 60 * 24));
    const hours = Math.floor((safeDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((safeDuration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((safeDuration % (1000 * 60)) / 1000);
    elements.timer.textContent = `${String(days).padStart(2, '0')}d : ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
}

// --- NEW: Edge Points UI ---
export function updateEdgePointsDisplay(points) {
    elements.edgePointsDisplay.textContent = `Edge: ${points} EP`;
}

export function updateEdgeOptions(currentPoints) {
    elements.edgeOptionsContainer.style.display = 'block';
    const nudgeCost = parseInt(elements.edgeOptionNudge.dataset.cost, 10);
    const calibrateCost = parseInt(elements.edgeOptionCalibrate.dataset.cost, 10);

    elements.edgeOptionNudge.disabled = currentPoints < nudgeCost;
    elements.edgeOptionCalibrate.disabled = currentPoints < calibrateCost;
}

export function hideEdgeOptions() {
    elements.edgeOptionsContainer.style.display = 'none';
}


export function renderUIForActiveTimer(startTime) {
    elements.timerOptions.style.display = 'none';
    elements.practiceGamesPanel.style.display = 'none';
    document.getElementById('camera-container').style.display = 'none';

    elements.startDate.textContent = new Date(startTime).toLocaleString();
    elements.startButton.style.display = 'none';
    elements.startLocktoberButton.style.display = 'none';
    elements.unlockButton.style.display = 'block';
    elements.resetButton.style.display = 'none';
    elements.pinDisplay.style.display = 'none';
}

export function renderUIForNoTimer(pendingPin, pendingPhoto) {
    elements.timerOptions.style.display = 'block';
    elements.practiceGamesPanel.style.display = 'block';

    elements.timer.textContent = '00d : 00h : 00m : 00s';
    elements.startDate.textContent = 'N/A';
    elements.startButton.style.display = 'block';
    elements.startLocktoberButton.style.display = 'block';
    elements.unlockButton.style.display = 'none';
    elements.resetButton.style.display = 'none';
    elements.timerMessage.textContent = '';
    elements.pinDisplay.style.display = 'block';

    if (pendingPhoto) {
        elements.photoDisplay.src = pendingPhoto;
        elements.photoDisplay.style.display = 'block';
        elements.pinCode.style.display = 'none';
    } else {
        elements.pinCode.textContent = pendingPin;
        elements.photoDisplay.style.display = 'none';
        elements.pinCode.style.display = 'block';
    }
}

export function updateTimerMessage(message = '', isPenalty = false) {
    elements.timerMessage.textContent = message;
    if (isPenalty) {
        elements.timerMessage.classList.add('penalty-message');
    } else {
        elements.timerMessage.classList.remove('penalty-message');
    }
}

export function updateLockdownTimer(message = '') {
    elements.lockdownTimer.textContent = message;
}

export function updateDoubledPenaltyTimer(message = '') {
    elements.doubledPenaltyTimer.textContent = message;
}

export function toggleUnlockButton(visible) {
    elements.unlockButton.style.display = visible ? 'block' : 'none';
}

export function renderHistory(history, saveCommentCallback, showNotesModalCallback) {
    elements.historyContainer.innerHTML = '';
    if (history.length === 0) {
        elements.historyContainer.textContent = 'No past sessions to display.';
        return;
    }
    history.forEach((item, index) => {
        const start = new Date(item.startTime).toLocaleString();
        const end = new Date(item.endTime).toLocaleString();
        const durationMs = item.endTime - item.startTime;
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
        const durationString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        const combinationDisplay = item.unlockMethod === 'photo'
            ? `<img src="${item.unlockData}" style="max-width: 100px; border-radius: 5px; margin-top: 5px;" alt="Unlock Photo">`
            : `<strong>Combination:</strong> ${item.unlockData}`;

        let gamesHtml = '';
        if (item.gameAttempts && item.gameAttempts.length > 0) {
            const gameListItems = item.gameAttempts.map(attempt => {
                const penaltyText = attempt.result === 'Loss' ? ` - ${attempt.penalty / 60000} min penalty` : ' - Unlocked';
                const gameName = attempt.name.charAt(0).toUpperCase() + attempt.name.slice(1);
                return `<li>${gameName} (${attempt.result})${penaltyText}</li>`;
            }).join('');
            gamesHtml = `
                <div class="game-history">
                    <div class="game-history-toggle" data-index="${index}">▶ Show Game History (${item.gameAttempts.length} attempts)</div>
                    <ul class="game-history-list" style="display: none;">
                        ${gameListItems}
                    </ul>
                </div>
            `;
        }
        const historyItemEl = document.createElement('div');
        historyItemEl.className = 'history-item';
        historyItemEl.innerHTML = `
            <button class="delete-btn" data-index="${index}">&times;</button>
            <p><strong>Lock-up:</strong> ${start}</p>
            <p><strong>Release:</strong> ${end}</p>
            <p><strong>Duration:</strong> ${durationString}</p>
            <p>${combinationDisplay}</p>
            ${gamesHtml}
            <div class="history-comment-display" data-index="${index}">${item.comment || 'Click to add notes...'}</div>
        `;
        elements.historyContainer.appendChild(historyItemEl);
    });

    elements.historyContainer.querySelectorAll('.delete-btn').forEach(el =>
        el.addEventListener('click', e => deleteHistoryItemCallback(e.target.dataset.index))
    );

    elements.historyContainer.querySelectorAll('.history-comment-display').forEach(el =>
        el.addEventListener('click', e => {
            const index = e.target.dataset.index;
            showNotesModalCallback(index, history[index].comment || '');
        })
    );

    elements.historyContainer.querySelectorAll('.game-history-toggle').forEach(el =>
        el.addEventListener('click', (e) => {
            const list = e.target.nextElementSibling;
            if (list.style.display === 'none') {
                list.style.display = 'block';
                e.target.textContent = `▼ Hide Game History`;
            } else {
                list.style.display = 'none';
                const attemptCount = list.children.length;
                e.target.textContent = `▶ Show Game History (${attemptCount} attempts)`;
            }
        })
    );
}

export function showFinishedState(unlockMethod, unlockData, isKeyholderMode) {
    elements.unlockButton.style.display = 'none';
    elements.resetButton.style.display = 'block';
    elements.pinDisplay.style.display = 'block';
    
    elements.photoDisplay.style.display = 'none';
    elements.pinCode.style.display = 'none';

    if (unlockMethod === 'photo') {
        elements.photoDisplay.src = unlockData;
        elements.photoDisplay.style.display = 'block';
        elements.revealPinBtn.style.display = 'none';
        elements.keyholderEmailBtn.style.display = 'none';
    } else { // PIN method
        elements.pinCode.style.display = 'block';
        elements.revealPinBtn.style.display = isKeyholderMode ? 'none' : 'inline-block';
        elements.keyholderEmailBtn.style.display = isKeyholderMode ? 'inline-block' : 'none';
        elements.pinCode.textContent = '************';

        const revealHandler = () => {
            sounds.playSound('flip');
            elements.pinCode.textContent = unlockData;
            elements.revealPinBtn.style.display = 'none';
            elements.revealPinBtn.removeEventListener('click', revealHandler);
        };
        elements.revealPinBtn.addEventListener('click', revealHandler);

        const emailHandler = () => {
            const subject = "Chastity Session Unlock PIN";
            const body = `The session has been completed. The unlock combination is: ${unlockData}`;
            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        };
        elements.keyholderEmailBtn.addEventListener('click', emailHandler);
    }

    updateTimerMessage('Congratulations. You may now end your session.');
}

export function showAchievement(achievement) {
    const toast = document.getElementById('achievement-toast');
    document.getElementById('achievement-name').textContent = achievement.name;
    document.getElementById('achievement-desc').textContent = achievement.description;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}
