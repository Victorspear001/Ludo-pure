export const PLAYER_COLORS = ['#ef4444', '#22c55e', '#eab308', '#3b82f6'];

// absolute index offsets for the main path loop
export const START_OFFSETS = [0, 13, 26, 39];

// safe spots on the main path
export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

export const BASE_POSITIONS = [
    // Red (index 0)
    [[2, 2], [2, 3], [3, 2], [3, 3]],
    // Green (index 1)
    [[2, 11], [2, 12], [3, 11], [3, 12]],
    // Yellow (index 2)
    [[11, 11], [11, 12], [12, 11], [12, 12]],
    // Blue (index 3)
    [[11, 2], [11, 3], [12, 2], [12, 3]]
];

export const HOME_POSITIONS = [
    [7, 6], // Red (Left middle of center)
    [6, 7], // Green (Top middle of center)
    [7, 8], // Yellow (Right middle of center)
    [8, 7]  // Blue (Bottom middle of center)
];

// The absolute main path in order (52 cells)
export const MAIN_PATH = [
    /* 00 */ [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    /* 05 */ [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    /* 11 */ [0, 7], [0, 8],
    /* 13 */ [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    /* 18 */ [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    /* 24 */ [7, 14], [8, 14],
    /* 26 */ [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    /* 31 */ [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    /* 37 */ [14, 7], [14, 6],
    /* 39 */ [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    /* 44 */ [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    /* 50 */ [7, 0], [6, 0]
];

export const HOME_PATHS = [
    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],     // Red
    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],     // Green
    [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], // Yellow
    [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]  // Blue
];
