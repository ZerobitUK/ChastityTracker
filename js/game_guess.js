let secretNumber, attempts;
const MAX_ATTEMPTS = 5;
let onWin, onLose;
let gameTimerInterval = null;
const SUDDEN_DEATH_SECONDS = 15;

const gameContainer = document.getElementById('guessthenumber-game-container');
const guessInput = document.getElementById('guess-input');
const guessSubmitBtn = document.getElementById('guess-submit-btn');
const guessMessageEl = document.getElementById('guess-message');
const guessPromptEl = document.getElementById('guess-prompt');
const guessTimerEl = document.getElementById('guess-timer');

function stopGameTimer() {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
    guessTimerEl.style.display = 'none';
}

function checkGuess() {
    const userGuess = parseInt(guessInput.value, 10);
    if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
        guessMessageEl.textContent = 'Please enter a number between 1 and 100.';
        return;
    }

    attempts++;
    const attemptsLeft = MAX_ATTEMPTS - attempts;
    guessPromptEl.textContent = `Attempts left: ${attemptsLeft}`;
    guessInput.value = '';
    guessInput.focus();

    if (userGuess === secretNumber) {
        stopGameTimer();
        guessMessageEl.textContent = `Correct! The number was ${secretNumber}. You won!`;
        guessSubmitBtn.disabled = true;
        onWin();
        return;
    }

    if (userGuess > secretNumber) {
        guessMessageEl.textContent = 'Too high!';
    } else {
        guessMessageEl.textContent = 'Too low!';
    }

    if (attempts >= MAX_ATTEMPTS) {
        stopGameTimer();
        guessMessageEl.textContent = `You've run out of attempts. The secret number was ${secretNumber}.`;
        guessSubmitBtn.disabled = true;
        onLose();
    }
}

export function initGuessTheNumber(winCallback, loseCallback, isSuddenDeath = false) {
    onWin = winCallback;
    onLose = loseCallback;

    gameContainer.style.display = 'block';

    secretNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;

    guessPromptEl.textContent = `Attempts left: ${MAX_ATTEMPTS}`;
    guessMessageEl.textContent = '';
    guessInput.value = '';
    guessSubmitBtn.disabled = false;
    guessInput.focus();

    stopGameTimer(); // Clear any existing timer

    if (isSuddenDeath) {
        document.getElementById('game-title').textContent = "Sudden Death: Guess the Number";
        document.getElementById('game-description').textContent = `Guess the number in ${SUDDEN_DEATH_SECONDS} seconds or face the consequences!`;
        guessTimerEl.style.display = 'block';
        let timeLeft = SUDDEN_DEATH_SECONDS;
        guessTimerEl.textContent = timeLeft;

        gameTimerInterval = setInterval(() => {
            timeLeft--;
            guessTimerEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                stopGameTimer();
                guessMessageEl.textContent = `Time's up! The secret number was ${secretNumber}.`;
                guessSubmitBtn.disabled = true;
                onLose();
            }
        }, 1000);

    } else {
        document.getElementById('game-title').textContent = "Guess the Number";
        document.getElementById('game-description').textContent = "Guess the secret number between 1 and 100 within 5 attempts.";
    }

    guessSubmitBtn.removeEventListener('click', checkGuess);
    guessSubmitBtn.addEventListener('click', checkGuess);
    guessInput.removeEventListener('keyup', handleEnterKey);
    guessInput.addEventListener('keyup', handleEnterKey);
}

function handleEnterKey(event) {
    if (event.key === "Enter") {
        checkGuess();
    }
}
