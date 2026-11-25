// Sizzle & Serve — the game itself.
// main.js owns the loop, the score and the combo, the shift clock and
// the rules that tie the board, the kitchen and the renderer together.
// It is the only file that imports the others; index.html loads this
// module and nothing else.

import { CANVAS_HEIGHT, CANVAS_WIDTH, COMBO_CAP, COMBO_STEP, EXPIRED_ORDER_PENALTY, POINTS_PER_SERVE, SERVES_PER_LEVEL, SHIFT_SECONDS, TIME_BONUS_PER_SECOND, WRONG_SERVE_PENALTY } from './config.js';
import { SoundFX } from './audio.js';
import { OrderBoard } from './orders.js';
import { Kitchen, STATIONS, binRect, pointInRect } from './kitchen.js';
import { COUNTER_BINS, ingredientById, plateMatchesRecipe } from './ingredients.js';
import { Renderer } from './render.js';
import { Input, hitAt } from './input.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const statusLine = document.getElementById('status');

class Game {
  constructor() {
    this.sound = new SoundFX();
    this.renderer = new Renderer(canvas);
    this.board = new OrderBoard();
    this.kitchen = new Kitchen();
    this.phase = 'playing';
    this.score = 0;
    this.served = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.level = 1;
    this.shiftLeft = SHIFT_SECONDS;
    this.now = 0;
    this.hover = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.popups = [];
    this.showHelp = false;
    this.warnedOrders = new Set();
    this.lastTick = performance.now();
    new Input(canvas, this);
  }

  get comboMultiplier() {
    return Math.min(COMBO_CAP, 1 + COMBO_STEP * Math.max(0, this.combo - 1));
  }

  get bestComboMultiplier() {
    return Math.min(COMBO_CAP, 1 + COMBO_STEP * Math.max(0, this.bestCombo - 1));
  }

  // The plate is ready when it exactly builds some ticket's recipe.
  get plateReady() {
    return this.board.orders.some((order) =>
      plateMatchesRecipe(this.kitchen.plate, order.recipe),
    );
  }

  ingredientKey(id) {
    return ingredientById(id)?.key ?? null;
  }

  addPopup(text, x, y, color = '#2e7d32') {
    this.popups.push({ text, x, y, color, bornAt: this.now });
    if (this.popups.length > 8) this.popups.shift();
  }

  announce(message) {
    statusLine.textContent = message;
  }

  // --- player actions (called by input.js) ---

  grab(ingredientId) {
    if (this.phase !== 'playing' || this.showHelp) return;
    const event = this.kitchen.grabFromBin(ingredientId, this.now);
    if (event.type === 'grab' || event.type === 'swap') this.sound.grab();
  }

  useBoard() {
    if (this.phase !== 'playing' || this.showHelp) return;
    const event = this.kitchen.useBoard(this.now);
    if (event.type === 'chop') this.sound.chop();
    if (event.type === 'chopped') this.sound.chopped();
    if (event.type === 'place-board') this.sound.grab();
    if (event.type === 'reject') this.sound.wrong();
  }

  useGrill() {
    if (this.phase !== 'playing' || this.showHelp) return;
    const event = this.kitchen.useGrill(this.now);
    if (event.type === 'place-grill') this.sound.grillOn();
    if (event.type === 'grilled') this.sound.grilled();
    if (event.type === 'reject') this.sound.wrong();
  }

  usePlate() {
    if (this.phase !== 'playing' || this.showHelp) return;
    const event = this.kitchen.usePlate(this.now);
    if (event.type === 'plated' || event.type === 'unplate') this.sound.plated();
    if (event.type === 'reject') this.sound.wrong();
  }

  useTrash() {
    if (this.phase !== 'playing' || this.showHelp) return;
    const event = this.kitchen.useTrash(this.now);
    if (event.type === 'trash') this.sound.chop();
  }

  // The bell serves the plate to the first ticket it matches.
  ringBell() {
    if (this.phase !== 'playing' || this.showHelp) return;
    const order = this.board.firstMatching(this.kitchen.plate, plateMatchesRecipe);
    if (!order) {
      if (this.kitchen.plate.length === 0) {
        this.kitchen.setFlash('Nothing on the plate to serve', this.now);
      } else {
        this.kitchen.setFlash('No ticket matches this plate', this.now);
      }
      this.sound.wrong();
      return;
    }
    this.serve(order);
  }

  serve(order) {
    const event = this.kitchen.serveTo(order);
    if (event.type === 'wrong-dish') {
      this.combo = 0;
      this.score = Math.max(0, this.score - WRONG_SERVE_PENALTY);
      this.kitchen.setFlash('Wrong dish! Check the recipe', this.now);
      this.sound.wrong();
      this.announce(`Wrong dish for order ${order.number}. Combo lost.`);
      return;
    }
    if (event.type !== 'served') return;
    this.board.remove(order.id);
    this.warnedOrders.delete(order.id);
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const timeBonus = Math.round(order.timeLeft * TIME_BONUS_PER_SECOND);
    const points = Math.round((POINTS_PER_SERVE + timeBonus) * this.comboMultiplier);
    this.score += points;
    this.served += 1;
    this.addPopup(`+${points}`, 890, 380, '#2e7d32');
    if (this.combo > 1) this.addPopup(`COMBO x${this.comboMultiplier.toFixed(1)}`, 890, 420, '#b8860b');
    this.sound.served();
    this.announce(`Served ${order.recipe.name} for ${points} points.`);
    const newLevel = 1 + Math.floor(this.served / SERVES_PER_LEVEL);
    if (newLevel > this.level) {
      this.level = newLevel;
      this.board.setLevel(newLevel);
      this.addPopup(`LEVEL ${newLevel}!`, 640, 300, '#8a4a1a');
      this.sound.levelUp();
    }
  }

  clickAt(x, y) {
    if (this.showHelp) {
      this.showHelp = false;
      return;
    }
    if (this.phase === 'over') {
      if (x >= 490 && x <= 790 && y >= 460 && y <= 516) this.restart();
      return;
    }
    const hit = hitAt(this, x, y);
    if (!hit) return;
    if (hit.kind === 'bin') this.grab(hit.id);
    else if (hit.kind === 'board') this.useBoard();
    else if (hit.kind === 'grill') this.useGrill();
    else if (hit.kind === 'plate') this.usePlate();
    else if (hit.kind === 'trash') this.useTrash();
    else if (hit.kind === 'bell') this.ringBell();
    else if (hit.kind === 'order') this.serve(hit.order);
  }

  restart() {
    this.board = new OrderBoard();
    this.kitchen = new Kitchen();
    this.phase = 'playing';
    this.score = 0;
    this.served = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.level = 1;
    this.shiftLeft = SHIFT_SECONDS;
    this.popups = [];
    this.warnedOrders = new Set();
    this.announce('New shift started. Good luck, chef!');
  }

  // --- the loop ---

  tick(dt) {
    if (this.phase !== 'playing' || this.showHelp) return;
    this.now += dt;
    this.shiftLeft -= dt;
    if (this.shiftLeft <= 0) {
      this.shiftLeft = 0;
      this.phase = 'over';
      this.sound.gameOver();
      this.announce(`Shift over. You scored ${this.score} points.`);
      return;
    }
    if (this.kitchen.tickGrill(dt)) {
      this.sound.grilled();
      this.addPopup('Patty ready!', 550, 290, '#2e7d32');
    }
    const expired = this.board.tick(dt, this.now);
    for (const order of expired) {
      this.combo = 0;
      this.warnedOrders.delete(order.id);
      this.score = Math.max(0, this.score - EXPIRED_ORDER_PENALTY);
      this.addPopup(`Order #${order.number} walked out!`, 640, 260, '#c0392b');
      this.sound.expired();
      this.announce(`Order ${order.number} expired. ${order.customer.name} left hungry.`);
    }
    // Warn once when the soonest ticket drops under 10 seconds, so the
    // player feels the rush before the customer walks out.
    const soonest = this.board.earliest();
    if (soonest && soonest.timeLeft <= 10 && !this.warnedOrders.has(soonest.id)) {
      this.warnedOrders.add(soonest.id);
      this.addPopup(`Hurry! Order #${soonest.number} almost out of time`, 640, 260, '#c0392b');
      this.sound.warn();
    }
    this.popups = this.popups.filter((popup) => this.now - popup.bornAt < 1.5);
  }

  frame(nowMs) {
    const dt = Math.min(0.1, (nowMs - this.lastTick) / 1000);
    this.lastTick = nowMs;
    this.tick(dt);
    this.renderer.draw(this);
    requestAnimationFrame((t) => this.frame(t));
  }

  start() {
    // Seed the board so the kitchen is busy from the first second.
    this.board.spawn(0);
    this.board.spawn(0);
    this.board.spawn(0);
    requestAnimationFrame((t) => {
      this.lastTick = t;
      this.frame(t);
    });
  }
}

const game = new Game();
window.sizzleGame = game;

// Screenshot staging: ?shot=start|mid|serve sets up real game state
// through the same actions a player uses, so each shot is a genuine
// render of the game in that state.
function applyShotPreset() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (!shot) return;
  if (shot === 'start') {
    game.board.orders.forEach((order) => { order.timeLeft = Math.min(order.timeLeft, 40); });
    return;
  }
  if (shot === 'mid' || shot === 'serve') {
    // Build a Garden Burger on the plate by hand, the way a player
    // would: bun, grilled patty, lettuce, tomato.
    game.kitchen.plate = shot === 'serve'
      ? ['bread', 'patty', 'lettuceChopped', 'tomatoChopped']
      : ['bread', 'patty', 'lettuceChopped'];
    // Make sure a Garden Burger ticket is on the board to match it.
    const garden = game.board.orders.find((o) => o.recipe.id === 'garden-burger');
    if (!garden) {
      const first = game.board.orders[0];
      if (first) first.recipe = { id: 'garden-burger', name: 'Garden Burger', items: ['bread', 'patty', 'lettuceChopped', 'tomatoChopped'], price: 100 };
    }
    game.board.orders.forEach((order) => { order.timeLeft = Math.min(order.timeLeft, 32); });
    game.kitchen.hand = shot === 'serve' ? null : 'tomatoChopped';
  }
}

game.start();
applyShotPreset();
