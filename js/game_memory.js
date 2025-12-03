import { db } from './db.js';
import { STORAGE_KEY } from './constants.js';

const CARDS = ['🔑', '🔒', '❤️', '🔥', '💦', '⌛', '🍆', '⛓️', '😈', '🤞'];
const MAX_TURNS = 14;

let firstCard, secondCard;
let lockBoard = false;
let onWin, onLose;
let state = { deck: [], turnsTaken: 0, matchedPairs: 0 };
const gameContainer = document.getElementById('memory-game-container');
const turnsLeftEl = document.getElementById('turns-left');

async function saveState() {
    await db.set(STORAGE_KEY.GAME_STATE, state);
}

function handleCardClick(event) {
    if (lockBoard) return;
    const clickedCard = event.currentTarget;
    const cardIndex = parseInt(clickedCard.dataset.index, 10);

    if (clickedCard === firstCard || state.deck[cardIndex].isFlipped) return;

    state.deck[cardIndex].isFlipped = true;
    clickedCard.classList.add('is-flipped');

    if (!firstCard) {
        firstCard = clickedCard;
    } else {
        // IMMEDIATE LOCK
        lockBoard = true;
        secondCard = clickedCard;
        state.turnsTaken++;
        turnsLeftEl.textContent = MAX_TURNS - state.turnsTaken;
        checkForMatch();
    }
    saveState();
}

function checkForMatch() {
    const isMatch = firstCard.dataset.value === secondCard.dataset.value;
    isMatch ? disableCards() : unflipCards();
    checkGameEnd();
}

function disableCards() {
    state.deck[firstCard.dataset.index].isMatched = true;
    state.deck[secondCard.dataset.index].isMatched = true;
    state.matchedPairs++;
    resetBoard();
}

function unflipCards() {
    setTimeout(() => {
        if(firstCard && secondCard) {
            state.deck[firstCard.dataset.index].isFlipped = false;
            state.deck[secondCard.dataset.index].isFlipped = false;
            firstCard.classList.remove('is-flipped');
            secondCard.classList.remove('is-flipped');
        }
        resetBoard();
        saveState();
    }, 1500);
}

function resetBoard() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

function checkGameEnd() {
    if (state.matchedPairs === CARDS.length) onWin();
    else if (state.turnsTaken >= MAX_TURNS) onLose();
}

// ... renderBoard function (same as original) ...

function renderBoard() {
    gameContainer.innerHTML = '';
    state.deck.forEach((cardState, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        if (cardState.isFlipped) card.classList.add('is-flipped');
        card.dataset.value = cardState.value;
        card.dataset.index = index;
        card.innerHTML = `
            <div class="card-face card-front">?</div>
            <div class="card-face card-back">${cardState.value}</div>
        `;
        if (!cardState.isMatched) card.addEventListener('click', handleCardClick);
        gameContainer.appendChild(card);
    });
    turnsLeftEl.textContent = MAX_TURNS - state.turnsTaken;
}

export function initMemoryGame(winCallback, loseCallback, savedState) {
    onWin = winCallback;
    onLose = loseCallback;
    
    // ... UI setup (same as original) ...
    document.getElementById('game-title').textContent = "The Keyholder's Memory";
    document.getElementById('game-description').textContent = "Match all pairs.";
    document.getElementById('turns-counter').style.display = 'block';
    gameContainer.style.display = 'grid';

    firstCard = null; secondCard = null; lockBoard = false;

    if (savedState && savedState.deck) {
        state = savedState;
    } else {
        state = {
            deck: [...CARDS, ...CARDS].sort(() => 0.5 - Math.random())
                .map(value => ({ value, isFlipped: false, isMatched: false })),
            turnsTaken: 0,
            matchedPairs: 0
        };
        saveState();
    }
    renderBoard();
}
