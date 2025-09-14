const gridEl = document.getElementById('minefield-grid');
const backButton = document.getElementById('minefield-back-btn');

const TILE_COUNT = 12;
const MINE_COUNT = 3;
let onResult;

function handleTileClick(event) {
    const tile = event.currentTarget;
    const isMine = tile.dataset.mine === 'true';

    const allTiles = gridEl.querySelectorAll('.minefield-tile');
    allTiles.forEach(t => {
        const newT = t.cloneNode(true);
        t.parentNode.replaceChild(newT, t);
    });

    tile.classList.add('is-flipped');
    
    setTimeout(() => {
        allTiles.forEach(t => {
            if (t !== tile) {
                t.classList.add('is-flipped');
            }
        });
    }, 1000);

    setTimeout(() => {
        backButton.style.display = 'block';
        onResult(isMine);
    }, 2500);
}

export function initMinefield(resultCallback) {
    onResult = resultCallback;
    gridEl.innerHTML = '';
    backButton.style.display = 'none';

    let mines = new Set();
    while(mines.size < MINE_COUNT) {
        mines.add(Math.floor(Math.random() * TILE_COUNT));
    }

    for (let i = 0; i < TILE_COUNT; i++) {
        const tile = document.createElement('div');
        tile.classList.add('minefield-tile');
        if (mines.has(i)) {
            tile.dataset.mine = 'true';
            tile.classList.add('mine');
        } else {
            tile.dataset.mine = 'false';
            tile.classList.add('safe');
        }
        tile.addEventListener('click', handleTileClick);
        gridEl.appendChild(tile);
    }
}
