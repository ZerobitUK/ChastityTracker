const CARDS = ['🔑', '🔒', '❤️', '🔥', '💧', '⌛', '💎', '⛓️'];
const MAX_TURNS = 12;

let firstCard, secondCard;
let lockBoard = false;
let matchedPairs = 0;
let turnsTaken = 0;
let onWin, onLose;

const gameContainer = document.getElementById('memory-game-container');
const turnsLeftEl = document.getElementById('turns-left');

function handleCardClick(event) {
    if (lockBoard) return;
    const clickedCard = event.currentTarget;
    if (clickedCard === firstCard || clickedCard.classList.contains('is-flipped')) return;

    clickedCard.classList.add('is-flipped');

    if (!firstCard) {
        firstCard = clickedCard;
        return;
    }

    secondCard = clickedCard;
    turnsTaken++;
    turnsLeftEl.textContent = MAX_TURNS - turnsTaken;
    checkForMatch();
}

function checkForMatch() {
    const isMatch = firstCard.dataset.value === secondCard.dataset.value;
    isMatch ? disableCards() : unflipCards();
    checkGameEnd();
}

function disableCards() {
    firstCard.removeEventListener('click', handleCardClick);
    secondCard.removeEventListener('click', handleCardClick);
    matchedPairs++;
    resetBoard();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('is-flipped');
        secondCard.classList.remove('is-flipped');
        resetBoard();
    }, 1500);
}

function resetBoard() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

function checkGameEnd() {
    if (matchedPairs === CARDS.length) {
        onWin();
    } else if (turnsTaken >= MAX_TURNS) {
        onLose();
    }
}

export function initMemoryGame(winCallback, loseCallback) {
    onWin = winCallback;
    onLose = loseCallback;

    document.getElementById('game-title').textContent = "The Keyholder's Memory";
    document.getElementById('game-description').textContent = "Match all pairs before you run out of turns.";
    document.getElementById('turns-counter').style.display = 'block';
    
    gameContainer.innerHTML = '';
    gameContainer.style.display = 'grid';

    const cardDeck = [...CARDS, ...CARDS].sort(() => 0.5 - Math.random());
    
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    matchedPairs = 0;
    turnsTaken = 0;
    turnsLeftEl.textContent = MAX_TURNS;

    cardDeck.forEach(value => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.value = value;
        card.innerHTML = `
            <div class="card-face card-front">?</div>
            <div class="card-face card-back">${value}</div>
        `;
        card.addEventListener('click', handleCardClick);
        gameContainer.appendChild(card);
    });
}
