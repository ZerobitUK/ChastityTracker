// This module handles all DOM manipulations and UI updates.

// DOM Element References
const elements = {
    // Screens
    timerScreen: document.getElementById('timer-screen'),
    gameSelectionScreen: document.getElementById('game-selection-screen'),
    gameScreen: document.getElementById('game-screen'),
    // Timer Display
    timer: document.getElementById('timer'),
    timerMessage: document.getElementById('timer-message'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    timerOptions: document.getElementById('timer-options'),
    // Buttons
    startButton: document.getElementById('start-button'),
    unlockButton: document.getElementById('unlock-button'),
    resetButton: document.getElementById('reset-button'),
    // PIN Display
    pinDisplay: document.getElementById('pin-display'),
    pinCode: document.getElementById('pin-code'),
    // History
    historyContainer: document.getElementById('history-container'),
    // Quote Banner
    quoteBanner: document.getElementById('quote-banner'),
    // Modal
    modalContainer: document.getElementById('modal-container'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalConfirmBtn: document.getElementById('modal-confirm-btn'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
};

let confirmCallback = null;

// Initialize Modal Listeners
elements.modalCloseBtn.addEventListener('click', closeModal);
elements.modalConfirmBtn.addEventListener('click', () => {
    if (typeof confirmCallback === 'function') {
        confirmCallback();
    }
    closeModal();
});

function closeModal() {
    elements.modalContainer.classList.remove('visible');
    confirmCallback = null;
}

export function showModal(title, message, showConfirm = false, callback = null) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.modalConfirmBtn.style.display = showConfirm ? 'block' : 'none';
    elements.modalCloseBtn.textContent = showConfirm ? 'Cancel' : 'Close';
    elements.modalContainer.classList.add('visible');
    confirmCallback = callback;
}

export function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}

export function updateTimerDisplay(durationMs) {
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    elements.timer.textContent = `${String(days).padStart(2, '0')}d : ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
}

export function renderUIForActiveTimer(startTime) {
    elements.timerOptions.style.display = 'none';
    elements.startDate.textContent = new Date(startTime).toLocaleString();
    elements.endDate.textContent = 'In Progress...';
    elements.startButton.style.display = 'none';
    elements.unlockButton.style.display = 'block';
    elements.resetButton.style.display = 'none';
    elements.pinDisplay.style.display = 'none';
}

export function renderUIForNoTimer(pendingPin) {
    elements.timerOptions.style.display = 'block';
    elements.timer.textContent = '00d : 00h : 00m : 00s';
    elements.startDate.textContent = 'N/A';
    elements.endDate.textContent = 'N/A';
    elements.startButton.style.display = 'block';
    elements.unlockButton.style.display = 'none';
    elements.resetButton.style.display = 'none';
    if(pendingPin) {
        elements.pinDisplay.style.display = 'block';
        elements.pinCode.textContent = pendingPin;
    } else {
        elements.pinDisplay.style.display = 'none';
    }
}

export function updateTimerMessage(message = '') {
    elements.timerMessage.textContent = message;
}

export function toggleUnlockButton(visible) {
    elements.unlockButton.style.display = visible ? 'block' : 'none';
}

export function renderHistory(history, saveCommentCallback, deleteHistoryItemCallback) {
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
        const historyItemEl = document.createElement('div');
        historyItemEl.className = 'history-item';
        historyItemEl.innerHTML = `
            <button class="delete-btn" data-index="${index}">&times;</button>
            <p><strong>Lock-up:</strong> ${start}</p>
            <p><strong>Release:</strong> ${end}</p>
            <p><strong>Duration:</strong> ${days}d ${hours}h</p>
            <p><strong>Combination:</strong> ${item.pin}</p>
            <textarea class="history-comment" data-index="${index}" placeholder="Add notes...">${item.comment || ''}</textarea>`;
        elements.historyContainer.appendChild(historyItemEl);
    });

    elements.historyContainer.querySelectorAll('.history-comment').forEach(el => 
        el.addEventListener('change', e => saveCommentCallback(e.target.dataset.index, e.target.value))
    );
    elements.historyContainer.querySelectorAll('.delete-btn').forEach(el =>
        el.addEventListener('click', e => deleteHistoryItemCallback(e.target.dataset.index))
    );
}

export function showFinishedState(pin, endDate) {
    elements.unlockButton.style.display = 'none';
    elements.resetButton.style.display = 'block';
    elements.pinDisplay.style.display = 'block';
    elements.pinCode.textContent = pin;
    elements.endDate.textContent = new Date(endDate).toLocaleString();
    updateTimerMessage('Congratulations. You may end your session.');
}
