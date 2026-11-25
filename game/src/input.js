// Sizzle & Serve — mouse and keyboard input.
// This module translates raw browser events into game actions and
// tells main.js which station the pointer is hovering, so the renderer
// can highlight it. It never owns game rules; it only names the action.

import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { COUNTER_BINS } from './ingredients.js';
import { STATIONS, binRect, pointInRect } from './kitchen.js';

// Which station (or bin, or order ticket) sits under a canvas point?
// Returns a hit object like { kind: 'board' } or { kind: 'bin', id }.
export function hitAt(game, x, y) {
  for (const [name, rect] of Object.entries(STATIONS)) {
    if (pointInRect(x, y, rect)) return { kind: name };
  }
  for (let i = 0; i < COUNTER_BINS.length; i += 1) {
    if (pointInRect(x, y, binRect(i))) return { kind: 'bin', id: COUNTER_BINS[i] };
  }
  // Order tickets live on the board, left to right from x=200.
  if (y >= 112 && y <= 212 && x >= 200) {
    const index = Math.floor((x - 200) / 262);
    const order = game.board.orders[index];
    if (order && x <= 200 + index * 262 + 248) return { kind: 'order', order };
  }
  return null;
}

export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.attach();
  }

  // Convert a pointer event to canvas coordinates, honouring the
  // canvas's on-screen scale.
  toCanvas(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  }

  attach() {
    this.canvas.addEventListener('pointermove', (event) => {
      const { x, y } = this.toCanvas(event);
      const hit = hitAt(this.game, x, y);
      this.game.hover = hit
        ? hit.kind === 'bin'
          ? `bin-${hit.id}`
          : hit.kind
        : null;
      this.game.mouseX = x;
      this.game.mouseY = y;
    });

    this.canvas.addEventListener('pointerdown', (event) => {
      this.game.sound.ensure();
      const { x, y } = this.toCanvas(event);
      this.game.clickAt(x, y);
    });

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      this.game.sound.ensure();
      if (key === 'm') {
        this.game.sound.toggleMute();
        return;
      }
      if (key === 'h') {
        this.game.showHelp = !this.game.showHelp;
        return;
      }
      if (key === 'escape') {
        this.game.showHelp = false;
        return;
      }
      if (this.game.phase === 'over') {
        if (key === 'r') this.game.restart();
        return;
      }
      if (this.game.showHelp) {
        this.game.showHelp = false;
        return;
      }
      const binIndex = COUNTER_BINS.findIndex(
        (id) => this.game.ingredientKey(id) === key,
      );
      if (binIndex !== -1) {
        this.game.grab(COUNTER_BINS[binIndex]);
        return;
      }
      if (key === 'c') this.game.useBoard();
      else if (key === 'g') this.game.useGrill();
      else if (key === 'p') this.game.usePlate();
      else if (key === 'b' || key === 'enter' || key === ' ') {
        event.preventDefault();
        this.game.ringBell();
      } else if (key === 'backspace' || key === 'delete') {
        this.game.useTrash();
      }
    });
  }
}
