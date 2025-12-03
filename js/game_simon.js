import { db } from './db.js';
import { STORAGE_KEY } from './constants.js';

// ... (variables same as original)
let sequence, playerSequence, level;
const WIN_LEVEL = 5;
let onWin, onLose, canClick = false;
const gameContainer = document.getElementById('simonsays-game-container');
const statusEl = document.getElementById('simon-status');
const buttons = Array.from(gameContainer.querySelectorAll('.simon-button'));

function handleButtonClick(event) {
    // ... (logic same as original)
    if (!canClick) return;
    const clickedColor = event.target.dataset.color;
    playerSequence.push(clickedColor);
    
    event.target.classList.add('active');
    setTimeout(() => event.target.classList.remove('active'), 200);

    const currentIndex = playerSequence.length - 1;
    if (playerSequence[currentIndex] !== sequence[currentIndex]) {
        statusEl.textContent = `Incorrect!`;
        onLose();
        return;
    }

    db.set(STORAGE_KEY.GAME_STATE, { sequence, playerSequence, level });

    if (playerSequence.length === sequence.length) {
        if (level >= WIN_LEVEL) onWin();
        else {
            statusEl.textContent = 'Correct!';
            setTimeout(nextSequence, 1500);
        }
    }
}

function playSequence() {
    canClick = false;
    buttons.forEach(button => button.classList.add('disabled'));
    let i = 0;

    // FIX: Added Math.max to prevent negative or too fast speeds
    const intervalSpeed = Math.max(300, 1000 - (level * 75));
    const flashDuration = Math.max(150, 500 - (level * 40));

    const sequenceInterval = setInterval(() => {
        if (i >= sequence.length) {
            clearInterval(sequenceInterval);
            canClick = true;
            buttons.forEach(button => button.classList.remove('disabled'));
            statusEl.textContent = 'Your turn!';
            return;
        }

        const button = document.querySelector(`.simon-button[data-color="${sequence[i]}"]`);
        if (button) {
            button.classList.add('active');
            setTimeout(() => {
                button.classList.remove('active');
            }, flashDuration);
        }
        i++;
    }, intervalSpeed);
}

// ... (export initSimonSays same as original, just ensure it uses db.set if needed)
export function initSimonSays(winCallback, loseCallback, savedState) {
    onWin = winCallback;
    onLose = loseCallback;
    document.getElementById('game-title').textContent = "Simon Says";
    document.getElementById('game-description').textContent = `Repeat the sequence.`;
    gameContainer.style.display = 'grid';
    statusEl.style.display = 'block';

    buttons.forEach(b => b.addEventListener('click', handleButtonClick));

    if (savedState && savedState.sequence) {
        sequence = savedState.sequence;
        playerSequence = savedState.playerSequence;
        level = savedState.level;
        playSequence();
    } else {
        sequence = []; playerSequence = []; level = 0;
        setTimeout(nextSequence, 1000);
    }
}

function nextSequence() {
    playerSequence = [];
    level++;
    statusEl.textContent = `Level ${level}`;
    const colors = ['red', 'green', 'blue', 'yellow'];
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
    db.set(STORAGE_KEY.GAME_STATE, { sequence, playerSequence, level });
    playSequence();
}
