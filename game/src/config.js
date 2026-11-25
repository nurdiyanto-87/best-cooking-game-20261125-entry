// Sizzle & Serve — configuration: canvas size, timings and the menu.
// Every number that tunes the game lives here so the rest of the code
// only reads it. Nothing in this file touches the DOM or the canvas.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// One shift lasts this long (seconds). When it hits zero the day ends.
export const SHIFT_SECONDS = 150;

// Orders appear on the board over time. The spawn gap shrinks as the
// kitchen levels up, but never below the floor, so pressure grows
// without the board ever flooding.
export const SPAWN_START_SECONDS = 9;
export const SPAWN_MIN_SECONDS = 4.5;
export const SPAWN_STEP_PER_LEVEL = 0.7;

// How long a customer waits before storming off (seconds).
export const ORDER_TIME_START = 48;
export const ORDER_TIME_MIN = 26;
export const ORDER_TIME_STEP_PER_LEVEL = 2.5;

// A raw patty needs this long on the grill before it is cooked.
export const GRILL_SECONDS = 6;

// Chops needed to turn a raw vegetable into a chopped one.
export const CHOPS_PER_VEGETABLE = 3;

// Scoring.
export const POINTS_PER_SERVE = 100;
export const TIME_BONUS_PER_SECOND = 2;
export const EXPIRED_ORDER_PENALTY = 25;
export const WRONG_SERVE_PENALTY = 10;
export const COMBO_STEP = 0.1;
export const COMBO_CAP = 2.0;

// A new level every time this many dishes are served.
export const SERVES_PER_LEVEL = 5;

// At most this many tickets can sit on the order board at once.
export const MAX_ORDERS = 4;

// At most this many layers fit on one plate.
export const MAX_PLATE_ITEMS = 6;
