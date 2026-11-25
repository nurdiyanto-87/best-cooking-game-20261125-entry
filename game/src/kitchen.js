// Sizzle & Serve — the kitchen stations.
// This module owns the player's hands and the three workstations:
// the chopping board, the grill and the assembly plate. It answers
// one question per station — "what happens when the player clicks
// here with this in hand?" — and returns a small event object the
// game loop turns into sound, particles and score.

import { CHOPS_PER_VEGETABLE, GRILL_SECONDS, MAX_PLATE_ITEMS } from './config.js';
import {
  CHOP_RESULT,
  GRILL_RESULT,
  ingredientById,
  plateMatchesRecipe,
} from './ingredients.js';

// Where each station sits on the 1280x720 canvas. The renderer draws
// them from these same rectangles, so clicks and pictures never drift.
export const STATIONS = {
  board: { x: 60, y: 300, w: 300, h: 150, label: 'CHOPPING BOARD' },
  grill: { x: 400, y: 300, w: 300, h: 150, label: 'GRILL' },
  plate: { x: 740, y: 300, w: 300, h: 150, label: 'ASSEMBLY PLATE' },
  trash: { x: 1080, y: 300, w: 140, h: 150, label: 'TRASH' },
  bell: { x: 1080, y: 470, w: 140, h: 90, label: 'SERVE BELL' },
};

// The six ingredient bins along the bottom of the counter.
export const BIN_WIDTH = 150;
export const BIN_HEIGHT = 96;
export const BIN_GAP = 18;
export const BIN_Y = 560;

export function binRect(index) {
  const totalWidth = 6 * BIN_WIDTH + 5 * BIN_GAP;
  const startX = (1280 - totalWidth) / 2;
  return {
    x: startX + index * (BIN_WIDTH + BIN_GAP),
    y: BIN_Y,
    w: BIN_WIDTH,
    h: BIN_HEIGHT,
  };
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export class Kitchen {
  constructor() {
    this.hand = null; // ingredient id the player is carrying, or null
    this.board = null; // { id, chops } — a vegetable being chopped
    this.grill = null; // { id, cooked } — a patty on the grill, 0..1
    this.plate = []; // ingredient ids stacked on the plate, bottom first
    this.flash = ''; // short hint text shown near the hand
    this.flashUntil = 0;
  }

  setFlash(text, nowSeconds) {
    this.flash = text;
    this.flashUntil = nowSeconds + 1.6;
  }

  // Take an ingredient from a counter bin. A full hand swaps: the old
  // item is tossed and the new one is picked up.
  grabFromBin(ingredientId, nowSeconds) {
    const item = ingredientById(ingredientId);
    if (!item) return { type: 'noop' };
    const swapped = this.hand !== null;
    this.hand = ingredientId;
    return { type: swapped ? 'swap' : 'grab', item, nowSeconds };
  }

  // Click the chopping board: put a choppable vegetable down, chop the
  // one already there, or pick the finished one up.
  useBoard(nowSeconds) {
    if (this.board) {
      this.board.chops += 1;
      if (this.board.chops >= CHOPS_PER_VEGETABLE) {
        const done = CHOP_RESULT[this.board.id];
        this.board = null;
        this.hand = done;
        return { type: 'chopped', item: ingredientById(done), nowSeconds };
      }
      return { type: 'chop', chops: this.board.chops, nowSeconds };
    }
    if (this.hand && ingredientById(this.hand)?.needsChop) {
      this.board = { id: this.hand, chops: 0 };
      this.hand = null;
      return { type: 'place-board', nowSeconds };
    }
    if (this.hand) {
      this.setFlash('That does not need chopping', nowSeconds);
      return { type: 'reject', nowSeconds };
    }
    return { type: 'noop' };
  }

  // Click the grill: put a raw patty on, or take a cooked one off.
  useGrill(nowSeconds) {
    if (this.grill) {
      if (this.grill.cooked >= 1) {
        const done = GRILL_RESULT[this.grill.id];
        this.grill = null;
        this.hand = done;
        return { type: 'grilled', item: ingredientById(done), nowSeconds };
      }
      this.setFlash('Still sizzling…', nowSeconds);
      return { type: 'reject', nowSeconds };
    }
    if (this.hand && ingredientById(this.hand)?.needsGrill) {
      this.grill = { id: this.hand, cooked: 0 };
      this.hand = null;
      return { type: 'place-grill', nowSeconds };
    }
    if (this.hand) {
      this.setFlash('Only patties go on the grill', nowSeconds);
      return { type: 'reject', nowSeconds };
    }
    return { type: 'noop' };
  }

  // Click the plate: add the hand item to the stack, or lift the top
  // item back into an empty hand to fix a mistake.
  usePlate(nowSeconds) {
    if (this.hand) {
      if (this.plate.length >= MAX_PLATE_ITEMS) {
        this.setFlash('The plate is full', nowSeconds);
        return { type: 'reject', nowSeconds };
      }
      this.plate.push(this.hand);
      const added = this.hand;
      this.hand = null;
      return { type: 'plated', item: ingredientById(added), nowSeconds };
    }
    if (this.plate.length > 0) {
      this.hand = this.plate.pop();
      return { type: 'unplate', item: ingredientById(this.hand), nowSeconds };
    }
    return { type: 'noop' };
  }

  // Click the trash: throw away whatever is in hand.
  useTrash(nowSeconds) {
    if (!this.hand) return { type: 'noop' };
    const tossed = this.hand;
    this.hand = null;
    return { type: 'trash', item: ingredientById(tossed), nowSeconds };
  }

  // Cook the patty over time; returns true the moment it finishes.
  tickGrill(dt) {
    if (!this.grill || this.grill.cooked >= 1) return false;
    this.grill.cooked = Math.min(1, this.grill.cooked + dt / GRILL_SECONDS);
    return this.grill.cooked >= 1;
  }

  // Serve the plate to one ticket. Success only when the plate holds
  // exactly that recipe; otherwise the plate stays and the combo dies.
  serveTo(order) {
    if (!order) return { type: 'noop' };
    if (this.plate.length === 0) return { type: 'empty-plate' };
    if (!plateMatchesRecipe(this.plate, order.recipe)) {
      return { type: 'wrong-dish', order };
    }
    const served = [...this.plate];
    this.plate = [];
    return { type: 'served', order, served };
  }

  clearPlate() {
    this.plate = [];
    this.hand = null;
    this.board = null;
    this.grill = null;
  }
}
