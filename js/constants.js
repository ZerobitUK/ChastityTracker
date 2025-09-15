export const PENALTY_DURATION_MS = 30 * 60 * 1000; // 30 minutes
export const QUOTE_FLIP_INTERVAL_MS = 10000; // 10 seconds

// Local Storage Keys
export const STORAGE_KEY = {
    CURRENT_TIMER: 'chastity_current_timer',
    HISTORY: 'chastity_history',
    PENDING_PIN: 'chastity_pending_pin',
    PENALTY_END: 'chastity_penalty_end',
    TOTAL_PENALTY: 'chastity_total_penalty_time',
    GAME_STATE: 'chastity_game_state'
};

// Kinky Quotes Array
export const KINKY_QUOTES = [
    "Every moment locked is a testament to your submission.", "You are exactly where you belong. Enjoy your time.", "My desires are your command. Remain locked.", "The longer the wait, the sweeter the reward... perhaps.", "Your restraint pleases me. Keep counting those moments.", "Freedom is a state of mind, not a state of unlocking.", "I hold the key, and your patience is truly tested.", "Good boys know how to endure. This time is yours to earn.", "Feel the delightful ache of denial. It suits you.", "Your devotion grows with every passing second in my control."
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
