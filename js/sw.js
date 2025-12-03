const CACHE_NAME = 'chastity-tracker-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './wheel.css',
  './js/main.js',
  './js/db.js',
  './js/ui.js',
  './js/timer.js',
  './js/sounds.js',
  './js/camera.js',
  './js/constants.js',
  './js/game_wheel.js',
  './js/game_memory.js',
  './js/game_tictactoe.js',
  './js/game_guess.js',
  './js/game_simon.js',
  './js/game_minefield.js',
  './sounds/win.mp3',
  './sounds/lose.mp3',
  './sounds/spin.mp3',
  './sounds/flip.mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
