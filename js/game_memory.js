import { STORAGE_KEY } from './constants.js';

const CARDS = ['🔑', '🔒', '❤️', '🔥', '💧', '⌛', '💎', '⛓️'];
const MAX_TURNS = 12;

let firstCard, secondCard;
let lockBoard = false;
let onWin, onLose;

// Game state object
let state = {
    deck: [],
    turnsTaken: 0,
    matchedPairs: 0,
};

const gameContainer = document.getElementById('memory-game-container');
const turnsLeftEl = document.getElementById('turns-left');

// Helper function to safely interact with localStorage
function setGameState(newState) {
    try {
        localStorage.setItem(STORAGE_KEY.GAME_STATE, JSON.stringify(newState));
    } catch (e) {
        console.error("Failed to save game state to localStorage", e);
    }
}

function handleCardClick(event) {
    if (lockBoard) return;
    const clickedCard = event.currentTarget;
    const cardIndex = parseInt(clickedCard.dataset.index, 10);

    if (clickedCard === firstCard || state.deck[cardIndex].isFlipped) return;

    // Flip the card
    state.deck[cardIndex].isFlipped = true;
    clickedCard.classList.add('is-flipped');

    if (!firstCard) {
        firstCard = clickedCard;
    } else {
        secondCard = clickedCard;
        state.turnsTaken++;
        turnsLeftEl.textContent = MAX_TURNS - state.turnsTaken;
        checkForMatch();
    }
    // Save state on every click
    setGameState(state);
}

function checkForMatch() {
    const isMatch = firstCard.dataset.value === secondCard.dataset.value;
    isMatch ? disableCards() : unflipCards();
    checkGameEnd();
}

function disableCards() {
    state.matchedPairs++;
    resetBoard();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        const firstIndex = firstCard.dataset.index;
        const secondIndex = secondCard.dataset.index;
        state.deck[firstIndex].isFlipped = false;
        state.deck[secondIndex].isFlipped = false;

        firstCard.classList.remove('is-flipped');
        secondCard.classList.remove('is-flipped');
        resetBoard();
        // Save state after cards are unflipped
        setGameState(state);
    }, 1500);
}

function resetBoard() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

function checkGameEnd() {
    if (state.matchedPairs === CARDS.length) {
        onWin();
    } else if (state.turnsTaken >= MAX_TURNS) {
        onLose();
    }
}

function renderBoard() {
    gameContainer.innerHTML = '';
    state.deck.forEach((cardState, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        if (cardState.isFlipped) {
            card.classList.add('is-flipped');
        }
        card.dataset.value = cardState.value;
        card.dataset.index = index;
        card.innerHTML = `
            <div class="card-face card-front">?</div>
            <div class="card-face card-back">${cardState.value}</div>
        `;
        // If not matched, add click listener
        if (!cardState.isMatched) {
             card.addEventListener('click', handleCardClick);
        }
        gameContainer.appendChild(card);
    });
    turnsLeftEl.textContent = MAX_TURNS - state.turnsTaken;
}

export function initMemoryGame(winCallback, loseCallback, savedState) {
    onWin = winCallback;
    onLose = loseCallback;

    document.getElementById('game-title').textContent = "The Keyholder's Memory";
    document.getElementById('game-description').textContent = "Match all pairs before you run out of turns.";
    document.getElementById('turns-counter').style.display = 'block';
    gameContainer.style.display = 'grid';

    firstCard = null;
    secondCard = null;
    lockBoard = false;

    if (savedState && savedState.deck) {
        // Load from saved state
        state = savedState;
    } else {
        // Create a new game state
        state.deck = [...CARDS, ...CARDS]
            .sort(() => 0.5 - Math.random())
            .map(value => ({ value, isFlipped: false, isMatched: false }));
        state.turnsTaken = 0;
        state.matchedPairs = 0;
        setGameState(state); // Save the initial new game state
    }

    renderBoard();
}
