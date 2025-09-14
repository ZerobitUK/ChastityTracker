let secretNumber, attempts;
const MAX_ATTEMPTS = 5;
let onWin, onLose;

// Get the DOM elements the game will interact with
const gameContainer = document.getElementById('guessthenumber-game-container');
const guessInput = document.getElementById('guess-input');
const guessSubmitBtn = document.getElementById('guess-submit-btn');
const guessMessageEl = document.getElementById('guess-message');
const guessPromptEl = document.getElementById('guess-prompt');

/**
 * Checks the user's guess against the secret number and updates the UI.
 */
function checkGuess() {
    const userGuess = parseInt(guessInput.value, 10);

    // Validate the input
    if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
        guessMessageEl.textContent = 'Please enter a number between 1 and 100.';
        return;
    }

    attempts++;
    const attemptsLeft = MAX_ATTEMPTS - attempts;
    guessPromptEl.textContent = `Attempts left: ${attemptsLeft}`;
    guessInput.value = ''; // Clear the input field
    guessInput.focus(); // Keep the input field focused for the next guess

    // Check for a win
    if (userGuess === secretNumber) {
        guessMessageEl.textContent = `Correct! The number was ${secretNumber}. You won!`;
        guessSubmitBtn.disabled = true; // Prevent further guesses
        onWin();
        return;
    }

    // Provide feedback
    if (userGuess > secretNumber) {
        guessMessageEl.textContent = 'Too high!';
    } else {
        guessMessageEl.textContent = 'Too low!';
    }

    // Check for a loss
    if (attempts >= MAX_ATTEMPTS) {
        guessMessageEl.textContent = `You've run out of attempts. The secret number was ${secretNumber}.`;
        guessSubmitBtn.disabled = true; // Prevent further guesses
        onLose();
    }
}

/**
 * Initializes the Guess the Number game.
 * @param {function} winCallback - The function to call when the player wins.
 * @param {function} loseCallback - The function to call when the player loses.
 */
export function initGuessTheNumber(winCallback, loseCallback) {
    onWin = winCallback;
    onLose = loseCallback;

    // Set up the game's UI
    document.getElementById('game-title').textContent = "Guess the Number";
    document.getElementById('game-description').textContent = "Guess the secret number between 1 and 100 within 5 attempts.";
    gameContainer.style.display = 'block';

    // Reset game state
    secretNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;

    // Reset UI elements
    guessPromptEl.textContent = `Attempts left: ${MAX_ATTEMPTS}`;
    guessMessageEl.textContent = '';
    guessInput.value = '';
    guessSubmitBtn.disabled = false;
    guessInput.focus();

    // Ensure we only have one event listener attached
    guessSubmitBtn.removeEventListener('click', checkGuess);
    guessSubmitBtn.addEventListener('click', checkGuess);

    // Allow pressing Enter to submit a guess
    guessInput.removeEventListener('keyup', handleEnterKey);
    guessInput.addEventListener('keyup', handleEnterKey);
}

/**
 * Helper function to allow the Enter key to submit a guess.
 * @param {KeyboardEvent} event
 */
function handleEnterKey(event) {
    if (event.key === "Enter") {
        checkGuess();
    }
}
