import { STORAGE_KEY } from './constants.js';
import { db } from './db.js';

let secretNumber, attempts;
const MAX_ATTEMPTS = 5;
let onWin, onLose;
let gameTimerInterval = null;

const gameContainer = document.getElementById('guessthenumber-game-container');
const guessInput = document.getElementById('guess-input');
const guessSubmitBtn = document.getElementById('guess-submit-btn');
const guessMessageEl = document.getElementById('guess-message');
const guessPromptEl = document.getElementById('guess-prompt');
const guessTimerEl = document.getElementById('guess-timer');

function stopGameTimer() {
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }
    guessTimerEl.style.display = 'none';
}

async function handleLoss() {
    stopGameTimer();
    guessMessageEl.textContent = `You've run out of attempts or time. The secret number was ${secretNumber}.`;
    guessSubmitBtn.disabled = true;
    
    // Increment sudden death fails to make future games harder
    const fails = await db.get('sudden_death_fails') || 0;
    await db.set('sudden_death_fails', fails + 1);
    
    onLose();
}

async function checkGuess() {
    const userGuess = parseInt(guessInput.value, 10);
    if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
        guessMessageEl.textContent = 'Please enter a number between 1 and 100.';
        return;
    }

    attempts++;
    setGameState({ secretNumber, attempts });

    const attemptsLeft = MAX_ATTEMPTS - attempts;
    guessPromptEl.textContent = `Attempts left: ${attemptsLeft}`;
    guessInput.value = '';
    guessInput.focus();

    if (userGuess === secretNumber) {
        stopGameTimer();
        guessMessageEl.textContent = `Correct! The number was ${secretNumber}. You won!`;
        guessSubmitBtn.disabled = true;
        
        // Reset difficulty scaling upon a win
        await db.set('sudden_death_fails', 0);
        
        onWin();
        return;
    }

    if (userGuess > secretNumber) {
        guessMessageEl.textContent = 'Too high!';
    } else {
        guessMessageEl.textContent = 'Too low!';
    }

    if (attempts >= MAX_ATTEMPTS) {
        await handleLoss();
    }
}

export async function initGuessTheNumber(winCallback, loseCallback, savedState, isSuddenDeath = false) {
    onWin = winCallback;
    onLose = loseCallback;

    gameContainer.style.display = 'block';

    if (savedState && savedState.secretNumber) {
        secretNumber = savedState.secretNumber;
        attempts = savedState.attempts;
    } else {
        secretNumber = Math.floor(Math.random() * 100) + 1;
        attempts = 0;
        setGameState({ secretNumber, attempts });
    }

    guessPromptEl.textContent = `Attempts left: ${MAX_ATTEMPTS - attempts}`;
    guessMessageEl.textContent = '';
    guessInput.value = '';
    guessSubmitBtn.disabled = false;
    guessInput.focus();

    stopGameTimer();

    if (isSuddenDeath) {
        // Fetch fail history to scale difficulty dynamically
        const fails = await db.get('sudden_death_fails') || 0;
        
        // Base time is 20s. Every past fail reduces it by 2s, to a floor of 8s.
        const dynamicSeconds = Math.max(8, 20 - (fails * 2));

        document.getElementById('game-title').textContent = "Sudden Death: Guess the Number";
        document.getElementById('game-description').textContent = `Guess the number in ${dynamicSeconds} seconds or face the consequences!`;
        guessTimerEl.style.display = 'block';
        
        let timeLeft = dynamicSeconds;
        guessTimerEl.textContent = timeLeft;

        gameTimerInterval = setInterval(() => {
            timeLeft--;
            guessTimerEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                handleLoss();
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

function setGameState(newState) {
    db.set(STORAGE_KEY.GAME_STATE, newState);
}
