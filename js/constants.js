export const PENALTY_DURATION_MS = 30 * 60 * 1000; // 30 minutes
export const QUOTE_FLIP_INTERVAL_MS = 10000; // 10 seconds

// Local Storage Keys
export const STORAGE_KEY = {
    CURRENT_TIMER: 'chastity_current_timer',
    HISTORY: 'chastity_history',
    PENDING_PIN: 'chastity_pending_pin',
    PENDING_PHOTO: 'chastity_pending_photo',
    PENALTY_END: 'chastity_penalty_end',
    TOTAL_PENALTY: 'chastity_total_penalty_time',
    GAME_STATE: 'chastity_game_state',
    EDGE_POINTS: 'chastity_edge_points' // <-- NEW
};

// Motivational Quotes Array
export const MOTIVATIONAL_QUOTES = [
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Perseverance is not a long race; it is many short races one after the other.",
    "The key to success is to focus on goals, not obstacles.",
    "The harder the conflict, the more glorious the triumph.",
    "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    "Discipline is the bridge between goals and accomplishment."
];

// Achievements
export const ACHIEVEMENTS = {
    'lock24h': { name: '24-Hour Club', description: 'Completed a continuous 24-hour lock-up.' },
    'lock7d': { name: 'One Week Strong', description: 'Remained locked for a full seven days.' },
    'lose3': { name: 'Risk Taker', description: 'Failed an unlock game three times in one session.' },
    'winGame': { name: 'Freedom Fighter', description: 'Successfully won your first unlock game.' }
};

// Random Events
export const RANDOM_EVENTS = [
    { name: 'Lockdown!', description: 'A sudden lockdown has occurred! The unlock button is disabled for the next hour.', duration: 60 * 60 * 1000 },
    { name: 'Moment of Mercy', description: 'The Keyholder feels generous. For the next hour, any penalty time from losing a game is halved.', effect: 'halfPenalty', duration: 60 * 60 * 1000 }
];

// Wheel of Fortune Outcomes
export const WHEEL_OUTCOMES = [
    { text: 'Safe', type: 'safe' },
    { text: '1 Hour Penalty', type: 'penalty', duration: 60 * 60 * 1000 },
    { text: '15 Min Penalty', type: 'penalty', duration: 15 * 60 * 1000 },
    { text: '30 Min Penalty', type: 'penalty', duration: 30 * 60 * 1000 },
    { text: 'Safe', type: 'safe' },
    { text: 'Double or Nothing', type: 'double' },
];
