const elements = {
    timerScreen: document.getElementById('timer-screen'),
    gameSelectionScreen: document.getElementById('game-selection-screen'),
    gameScreen: document.getElementById('game-screen'),
    timer: document.getElementById('timer'),
    timerMessage: document.getElementById('timer-message'),
    lockdownTimer: document.getElementById('lockdown-timer'),
    doubledPenaltyTimer: document.getElementById('doubled-penalty-timer'),
    startDate: document.getElementById('startDate'),
    startDate: document.getElementById('startDate'),
    timerOptions: document.getElementById('timer-options'),
    startButton: document.getElementById('start-button'),
    unlockButton: document.getElementById('unlock-button'),
    resetButton: document.getElementById('reset-button'),
    pinDisplay: document.getElementById('pin-display'),
    pinCode: document.getElementById('pin-code'),
    historyContainer: document.getElementById('history-container'),
    quoteBanner: document.getElementById('quote-banner'),
    modalContainer: document.getElementById('modal-container'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalConfirmBtn: document.getElementById('modal-confirm-btn'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
};

let confirmCallback = null;

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
    const safeDuration = Math.max(0, durationMs);
    const days = Math.floor(safeDuration / (1000 * 60 * 60 * 24));
    const hours = Math.floor((safeDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((safeDuration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((safeDuration % (1000 * 60)) / 1000);
    elements.timer.textContent = `${String(days).padStart(2, '0')}d : ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
}

export function renderUIForActiveTimer(startTime) {
    elements.timerOptions.style.display = 'none';
    elements.startDate.textContent = new Date(startTime).toLocaleString();
    elements.startButton.style.display = 'none';
    elements.unlockButton.style.display = 'block';
    elements.resetButton.style.display = 'none';
    elements.pinDisplay.style.display = 'none';
}

export function renderUIForNoTimer(pendingPin) {
    elements.timerOptions.style.display = 'block';
    elements.timer.textContent = '00d : 00h : 00m : 00s';
    elements.startDate.textContent = 'N/A';
    elements.startButton.style.display = 'block';
    elements.unlockButton.style.display = 'none';
    elements.resetButton.style.display = 'none';
    elements.timerMessage.textContent = '';
    elements.pinDisplay.style.display = 'block';
    elements.pinCode.textContent = pendingPin;
}

export function updateTimerMessage(message = '') {
    elements.timerMessage.textContent = message;
}

export function updateLockdownTimer(message = '') {
    elements.lockdownTimer.textContent = message;
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
        
        // Updated duration calculation to include minutes and seconds
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
        
        // Updated duration string to display all parts
        const durationString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

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
            <p><strong>Combination:</strong> ${item.pin}</p>
            ${gamesHtml}
            <textarea class="history-comment" data-index="${index}" placeholder="Add notes...">${item.comment || ''}</textarea>`;
        elements.historyContainer.appendChild(historyItemEl);
    });

    elements.historyContainer.querySelectorAll('.history-comment').forEach(el => 
        el.addEventListener('change', e => saveCommentCallback(e.target.dataset.index, e.target.value))
    );
    elements.historyContainer.querySelectorAll('.delete-btn').forEach(el =>
        el.addEventListener('click', e => deleteHistoryItemCallback(e.target.dataset.index))
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

export function showFinishedState(pin, endDate) {
    elements.unlockButton.style.display = 'none';
    elements.resetButton.style.display = 'block';
    elements.pinDisplay.style.display = 'block';
    elements.pinCode.textContent = pin;
    updateTimerMessage('Congratulations. You may end your session.');
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

export function updateDoubledPenaltyTimer(message = '') {
    elements.doubledPenaltyTimer.textContent = message;
}
