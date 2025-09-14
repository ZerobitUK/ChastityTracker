let sequence, playerSequence, level;
const WIN_LEVEL = 5;
let onWin, onLose;
let canClick = false;

const gameContainer = document.getElementById('simonsays-game-container');
const statusEl = document.getElementById('simon-status');
const buttons = gameContainer.querySelectorAll('.simon-button');

function handleButtonClick(event) {
    if (!canClick) return;
    const clickedColor = event.target.dataset.color;
    playerSequence.push(clickedColor);
    event.target.classList.add('active');
    setTimeout(() => event.target.classList.remove('active'), 200);
    const currentIndex = playerSequence.length - 1;
    if (playerSequence[currentIndex] !== sequence[currentIndex]) {
        statusEl.textContent = `Incorrect! You failed at Level ${level}.`;
        onLose();
        return;
    }
    if (playerSequence.length === sequence.length) {
        if (level >= WIN_LEVEL) {
            statusEl.textContent = `Victory! You completed Level ${level}.`;
            onWin();
        } else {
            statusEl.textContent = 'Correct! Next level...';
            setTimeout(nextSequence, 1500);
        }
    }
}

function playSequence() {
    canClick = false;
    buttons.forEach(button => button.classList.add('disabled'));
    let i = 0;
    const sequenceInterval = setInterval(() => {
        const button = document.querySelector(`.simon-button[data-color="${sequence[i]}"]`);
        if (button) button.classList.add('active');
        setTimeout(() => {
            if (button) button.classList.remove('active');
        }, 500);
        i++;
        if (i >= sequence.length) {
            clearInterval(sequenceInterval);
            canClick = true;
            buttons.forEach(button => button.classList.remove('disabled'));
            statusEl.textContent = 'Your turn!';
        }
    }, 1000);
}

function nextSequence() {
    playerSequence = [];
    level++;
    statusEl.textContent = `Level ${level}`;
    const colors = ['red', 'green', 'blue', 'yellow'];
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
    playSequence();
}

export function initSimonSays(winCallback, loseCallback) {
    onWin = winCallback;
    onLose = loseCallback;
    document.getElementById('game-title').textContent = "Simon Says";
    document.getElementById('game-description').textContent = `Repeat the sequence correctly for ${WIN_LEVEL} levels.`;
    gameContainer.style.display = 'grid';
    statusEl.style.display = 'block';
    sequence = [];
    playerSequence = [];
    level = 0;
    buttons.forEach(button => button.removeEventListener('click', handleButtonClick));
    buttons.forEach(button => button.addEventListener('click', handleButtonClick));
    setTimeout(nextSequence, 1000);
}
