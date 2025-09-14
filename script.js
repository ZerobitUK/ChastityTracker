const kinkyQuotes = [
    "Every moment locked is a testament to your submission.",
    "You are exactly where you belong. Enjoy your time.",
    "My desires are your command. Remain locked.",
    "The longer the wait, the sweeter the reward... perhaps.",
    "Your restraint pleases me. Keep counting those moments.",
    "Freedom is a state of mind, not a state of unlocking.",
    "I hold the key, and your patience is truly tested.",
    "Good boys know how to endure. This time is yours to earn.",
    "Feel the delightful ache of denial. It suits you.",
    "Your devotion grows with every passing second in my control.",
    "While you endure, I can enjoy the simple pleasure of a long, hot shower.",
    "The world is full of things I can do that you cannot. My freedom is your burden.",
    "I'm going to stand and pee. You can't. That's a good thing for both of us.",
    "I can have sex. You can't. Your denial makes me a better keyholder. Thank you for your service.",
    "I am currently enjoying myself. I hope you are not.",
    "My body is free to explore, while yours is a prisoner of your own making.",
    "Every thought of what you're missing only makes my own freedom taste sweeter.",
    "Don't worry, your keys are safe with me, while I enjoy all the things you are denied.",
    "You can't even stand to pee anymore. That's a little reminder of your position.",
    "Your frustration is my greatest entertainment.",
    "I'm enjoying a very long, very loud, and very satisfying pleasure. I trust you are not.",
    "You can't escape your lock, but I can escape my thoughts of your denial.",
    "I'm going to take a nap now. You have my permission to get an erection, if you can.",
    "I am going to get dressed. It's too bad you can't get off.",
    "The world is mine, and yours is a cage. That is the way it should be.",
    "My partner has his cock free, while yours is caged. I hope you enjoy your denial.",
    "My body is free to explore, while yours is a prisoner of your own making.",
    "I can have sex. You can't. Your denial makes me a better keyholder. Thank you for your service."
];

const timerEl = document.getElementById('timer');
const startDateEl = document.getElementById('startDate');
const endDateEl = document.getElementById('endDate');
const timerScreen = document.getElementById('timer-screen');
const quoteBanner = document.getElementById('quote-banner');
const historyContainer = document.getElementById('history-container');
const startButton = document.getElementById('start-button');
const unlockButton = document.getElementById('unlock-button');
const resetButton = document.getElementById('reset-button');
const pinDisplay = document.getElementById('pin-display');
const pinCodeEl = document.getElementById('pin-code');
const timerMessageEl = document.getElementById('timer-message');
const timerOptionsEl = document.getElementById('timer-options');
const mainContent = document.getElementById('main-content');
const gameScreen = document.getElementById('game-screen');

let interval = null;
let quoteInterval = null;
let currentQuoteIndex = 0;

// Game state variables
const gameBoard = document.getElementById('game-board');
const turnsLeftEl = document.getElementById('turns-left');
const cards = ['🔑', '🔒', '❤️', '🔥', '💧', '⌛', '💎', '⛓️'];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;
let turnsTaken = 0;
const MAX_TURNS = 12;

// Banner Functions
function startQuoteFlipper() {
    const randomIndex = Math.floor(Math.random() * kinkyQuotes.length);
    quoteBanner.textContent = kinkyQuotes[randomIndex];
    quoteInterval = setInterval(() => {
        quoteBanner.style.opacity = '0';
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * kinkyQuotes.length);
            quoteBanner.textContent = kinkyQuotes[randomIndex];
            quoteBanner.style.opacity = '1';
        }, 1000);
    }, 10000);
}

// Timer and Data Functions
function resetApp() {
    if (confirm("Are you sure you want to reset the entire app? This will delete all timer history and current session data. This cannot be undone.")) {
        localStorage.clear();
        alert("App has been reset.");
        window.location.reload();
    }
}

function loadData() {
    const currentTimer = JSON.parse(localStorage.getItem('chastity_current_timer'));
    const history = JSON.parse(localStorage.getItem('chastity_history')) || [];
    
    history.sort((a, b) => b.endTime - a.endTime);

    renderHistory(history);

    if (currentTimer && currentTimer.startTime) {
        timerOptionsEl.style.display = 'none';

        const startTime = currentTimer.startTime;
        startDateEl.textContent = new Date(startTime).toLocaleString();
        if (currentTimer.endTime) {
            const endTime = currentTimer.endTime;
            endDateEl.textContent = new Date(endTime).toLocaleString();
            const durationMs = endTime - startTime;
            updateTimerDisplay(durationMs);
            startButton.style.display = 'block';
            unlockButton.style.display = 'none';
            resetButton.style.display = 'none';
            pinDisplay.style.display = 'none';
        } else {
            endDateEl.textContent = 'N/A';
            startUpdateInterval(startTime);
            startButton.style.display = 'none';
            unlockButton.style.display = 'block';
            resetButton.style.display = 'none';
            pinDisplay.style.display = 'none';
        }
    } else {
        timerOptionsEl.style.display = 'block';
        
        let pendingPin = localStorage.getItem('chastity_pending_pin');
        if (!pendingPin) {
            pendingPin = generatePin();
            localStorage.setItem('chastity_pending_pin', pendingPin);
        }
        displayPin(pendingPin);

        timerEl.textContent = '00d : 00h : 00m : 00s';
        startDateEl.textContent = 'N/A';
        endDateEl.textContent = 'N/A';
        startButton.style.display = 'block';
        unlockButton.style.display = 'none';
        resetButton.style.display = 'none';
    }
}

function renderHistory(history) {
    historyContainer.innerHTML = '';
    if (history.length === 0) {
        historyContainer.textContent = 'No past sessions to display.';
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

        let penaltyString = '';
        if (item.penaltyTime && item.penaltyTime > 0) {
            const penaltyHours = Math.floor(item.penaltyTime / (1000 * 60 * 60));
            const penaltyMinutes = Math.floor((item.penaltyTime % (1000 * 60 * 60)) / (1000 * 60));
            penaltyString = `<p><strong>Penalty Time:</strong> ${penaltyHours}h ${penaltyMinutes}m</p>`;
        }
        
        const historyItemEl = document.createElement('div');
        historyItemEl.className = 'history-item';
        historyItemEl.innerHTML = `
            <button class="delete-btn" onclick="deleteHistoryItem(${index})">&times;</button>
            <p><strong>Lock-up:</strong> ${start}</p>
            <p><strong>Release:</strong> ${end}</p>
            <p><strong>Duration:</strong> ${durationString}</p>
            ${penaltyString}
            ${item.pin ? `<p><strong>Combination:</strong> <span class="pin-code-history">${item.pin}</span></p>` : ''}
            <p><strong>Notes:</strong></p>
            <textarea class="history-comment" data-index="${index}" placeholder="Add your comments here..." onchange="saveComment(${index}, this.value)">${item.comment || ''}</textarea>
        `;
        historyContainer.appendChild(historyItemEl);
    });
}
 
function saveComment(index, comment) {
    let history = JSON.parse(localStorage.getItem('chastity_history')) || [];
    if (history[index]) {
        history[index].comment = comment;
        localStorage.setItem('chastity_history', JSON.stringify(history));
    }
}

function deleteHistoryItem(index) {
    let history = JSON.parse(localStorage.getItem('chastity_history')) || [];
    if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
        history.splice(index, 1);
        localStorage.setItem('chastity_history', JSON.stringify(history));
        loadData();
    }
}

function startUpdateInterval(startTime) {
    clearInterval(interval);
    interval = setInterval(() => {
        const now = new Date().getTime();
        const durationMs = now - startTime;
        updateTimerDisplay(durationMs);

        const currentTimer = JSON.parse(localStorage.getItem('chastity_current_timer'));
        
        const penaltyEndTime = JSON.parse(localStorage.getItem('chastity_penalty_end'));
        if (penaltyEndTime) {
            const penaltyTimeLeft = penaltyEndTime - now;
            if (penaltyTimeLeft > 0) {
                const minutes = Math.floor((penaltyTimeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((penaltyTimeLeft % (1000 * 60)) / 1000);
                timerMessageEl.textContent = `Penalty: Cannot request unlock for ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s.`;
                unlockButton.style.display = 'none';
                return;
            } else {
                localStorage.removeItem('chastity_penalty_end');
            }
        }

        if (currentTimer.isMinimum && currentTimer.minEndTime) {
            const minTimeLeft = currentTimer.minEndTime - now;
            if (minTimeLeft > 0) {
                const days = Math.floor(minTimeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((minTimeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((minTimeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((minTimeLeft % (1000 * 60)) / 1000);
                timerMessageEl.textContent = `Minimum Time Remaining: ${days}d ${hours}h ${minutes}m ${seconds}s`;
                unlockButton.style.display = 'none';
            } else {
                timerMessageEl.textContent = `Minimum time has been met.`;
                unlockButton.style.display = 'block';
            }
        } else {
            timerMessageEl.textContent = '';
            unlockButton.style.display = 'block';
        }
    }, 1000);
}

function updateTimerDisplay(durationMs) {
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    timerEl.textContent = `${String(days).padStart(2, '0')}d : ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
}
 
function generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function displayPin(pin) {
    pinCodeEl.textContent = pin;
    pinDisplay.style.display = 'block';
}

function startTimer() {
    const now = new Date().getTime();
    const pendingPin = localStorage.getItem('chastity_pending_pin');
    const timerType = document.querySelector('input[name="timerType"]:checked').value;

    let currentTimer = { startTime: now, endTime: null, pin: pendingPin, isMinimum: false, minEndTime: null };

    if (timerType === 'random') {
        const minHours = 12;
        const maxHours = 72;
        const randomHours = Math.floor(Math.random() * (maxHours - minHours + 1)) + minHours;
        const minEndTime = now + (randomHours * 60 * 60 * 1000);
        currentTimer.isMinimum = true;
        currentTimer.minEndTime = minEndTime;
    }

    localStorage.setItem('chastity_current_timer', JSON.stringify(currentTimer));
    localStorage.removeItem('chastity_pending_pin');
    localStorage.removeItem('chastity_penalty_end');
    loadData();
}

function resetTimer() {
    const currentTimer = JSON.parse(localStorage.getItem('chastity_current_timer'));
    if (currentTimer && currentTimer.startTime) {
        const endTime = new Date().getTime();
        
        // Get total penalty time
        const totalPenaltyTime = JSON.parse(localStorage.getItem('chastity_total_penalty_time')) || 0;

        const newHistoryItem = { 
            startTime: currentTimer.startTime, 
            endTime: endTime, 
            comment: '',
            pin: currentTimer.pin,
            penaltyTime: totalPenaltyTime
        };
        const history = JSON.parse(localStorage.getItem('chastity_history')) || [];
        history.push(newHistoryItem);
        localStorage.setItem('chastity_history', JSON.stringify(history));
        
        displayPin(currentTimer.pin);
        localStorage.removeItem('chastity_current_timer');
        localStorage.removeItem('chastity_penalty_end');
        localStorage.removeItem('chastity_total_penalty_time'); // Clear the total penalty for the new session
    }
    loadData();
}
 
function requestUnlock() {
    const penaltyEndTime = JSON.parse(localStorage.getItem('chastity_penalty_end'));
    if (penaltyEndTime && new Date().getTime() < penaltyEndTime) {
        const penaltyTimeLeft = penaltyEndTime - new Date().getTime();
        const minutes = Math.ceil(penaltyTimeLeft / (1000 * 60));
        alert(`You are still in a penalty period. Please wait for approximately ${minutes} more minute(s).`);
        return;
    }

    timerScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    initGame();
}

// **New Functionality:** Prevents user from leaving the game screen once started
function hideGameScreen() {
    alert("You cannot abandon the game once it has begun. You must finish.");
}

// --- Keyholder's Memory Functions ---
function initGame() {
    gameBoard.innerHTML = '';
    const cardDeck = [...cards, ...cards];
    cardDeck.sort(() => 0.5 - Math.random());
    
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    matchedPairs = 0;
    turnsTaken = 0;
    turnsLeftEl.textContent = MAX_TURNS;

    cardDeck.forEach(cardValue => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.value = cardValue;
        card.textContent = '?';
        card.addEventListener('click', handleCardClick);
        gameBoard.appendChild(card);
    });
}

function handleCardClick(event) {
    if (lockBoard) return;
    const clickedCard = event.currentTarget;
    if (clickedCard.classList.contains('is-flipped')) return;

    clickedCard.textContent = clickedCard.dataset.value;
    clickedCard.classList.add('is-flipped');

    if (!firstCard) {
        firstCard = clickedCard;
    } else {
        secondCard = clickedCard;
        turnsTaken++;
        turnsLeftEl.textContent = MAX_TURNS - turnsTaken;
        checkMatch();
    }
}

function checkMatch() {
    const isMatch = firstCard.dataset.value === secondCard.dataset.value;
    if (isMatch) {
        matchedPairs++;
        disableCards();
    } else {
        unflipCards();
    }

    if (matchedPairs === cards.length) {
        winGame();
    } else if (turnsTaken >= MAX_TURNS) {
        loseGame();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', handleCardClick);
    secondCard.removeEventListener('click', handleCardClick);
    resetBoard();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.textContent = '?';
        secondCard.textContent = '?';
        firstCard.classList.remove('is-flipped');
        secondCard.classList.remove('is-flipped');
        resetBoard();
    }, 1500);
}

function resetBoard() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

function winGame() {
    alert("You have proven your patience. The Keyholder grants you this one reprieve.");
    
    clearInterval(interval);
    const currentTimer = JSON.parse(localStorage.getItem('chastity_current_timer'));
    if (currentTimer) {
        const finalDurationMs = new Date().getTime() - currentTimer.startTime;
        updateTimerDisplay(finalDurationMs);
    }
    
    // **Modified:** Transition to a state where the user can reset
    gameScreen.style.display = 'none';
    timerScreen.style.display = 'block';
    resetButton.style.display = 'block';
    unlockButton.style.display = 'none';
}

function loseGame() {
    alert("Your impatience is... disappointing. You have failed the test. You are now penalised and cannot request an unlock for 30 minutes.");
    
    const penaltyDuration = 30 * 60 * 1000;
    const penaltyEndTime = new Date().getTime() + penaltyDuration;
    
    // **New:** Add the 30-minute penalty to the total penalty time
    let totalPenaltyTime = JSON.parse(localStorage.getItem('chastity_total_penalty_time')) || 0;
    totalPenaltyTime += penaltyDuration;
    localStorage.setItem('chastity_total_penalty_time', JSON.stringify(totalPenaltyTime));

    localStorage.setItem('chastity_penalty_end', JSON.stringify(penaltyEndTime));

    gameScreen.style.display = 'none';
    timerScreen.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    startQuoteFlipper();
    loadData();
});
