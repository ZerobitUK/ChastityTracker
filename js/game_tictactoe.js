let board;
const PLAYER = 'X';
const AI = 'O';
let onWin, onLose;
let isPlayerTurn = true;

const gameContainer = document.getElementById('tictactoe-game-container');
const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function handleCellClick(event) {
    if (!isPlayerTurn) return;

    const index = event.target.dataset.index;
    if (board[index] !== '') return;

    isPlayerTurn = false;
    board[index] = PLAYER;
    renderBoard();

    if (checkWin(PLAYER)) {
        setTimeout(() => onWin(), 100);
        return;
    }
    if (getEmptyCells().length === 0) {
        setTimeout(() => onWin(), 100);
        return;
    }

    setTimeout(aiMove, 500);
}

function checkWin(symbol, currentBoard = board) {
    return winConditions.some(c => c.every(i => currentBoard[i] === symbol));
}

function getEmptyCells(currentBoard = board) {
    return currentBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
}

function aiMove() {
    let bestScore = -Infinity;
    let move;
    const emptyCells = getEmptyCells();

    for (const cellIndex of emptyCells) {
        board[cellIndex] = AI;
        let score = minimax(board, 0, false);
        board[cellIndex] = '';
        if (score > bestScore) {
            bestScore = score;
            move = cellIndex;
        }
    }

    if (move !== undefined) {
        board[move] = AI;
        renderBoard();
        if (checkWin(AI)) {
            setTimeout(() => onLose(), 100);
        } else if (getEmptyCells().length === 0) {
            setTimeout(() => onWin(), 100);
        } else {
            isPlayerTurn = true;
        }
    }
}

const scores = { [AI]: 10, [PLAYER]: -10, draw: 0 };

function minimax(currentBoard, depth, isMaximizing) {
    if (checkWin(AI, currentBoard)) return scores[AI] - depth;
    if (checkWin(PLAYER, currentBoard)) return scores[PLAYER] + depth;
    if (getEmptyCells(currentBoard).length === 0) return scores.draw;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (const cellIndex of getEmptyCells(currentBoard)) {
            currentBoard[cellIndex] = AI;
            let score = minimax(currentBoard, depth + 1, false);
            currentBoard[cellIndex] = '';
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (const cellIndex of getEmptyCells(currentBoard)) {
            currentBoard[cellIndex] = PLAYER;
            let score = minimax(currentBoard, depth + 1, true);
            currentBoard[cellIndex] = '';
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
}

function renderBoard() {
    gameContainer.innerHTML = '';
    board.forEach((value, index) => {
        const cell = document.createElement('div');
        cell.classList.add('tictactoe-cell');
        cell.dataset.index = index;
        cell.textContent = value;
        if (value === '' && isPlayerTurn) {
            cell.addEventListener('click', handleCellClick);
        }
        gameContainer.appendChild(cell);
    });
}

export function initTicTacToe(winCallback, loseCallback) {
    onWin = winCallback;
    onLose = loseCallback;
    isPlayerTurn = true;
    document.getElementById('game-title').textContent = "Tic-Tac-Toe";
    document.getElementById('game-description').textContent = "Beat the Keyholder to earn your freedom. A draw is a reprieve.";
    gameContainer.style.display = 'grid';
    board = ['', '', '', '', '', '', '', '', ''];
    renderBoard();
}
