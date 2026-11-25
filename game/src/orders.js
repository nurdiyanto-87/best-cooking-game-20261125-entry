// Sizzle & Serve — the order board.
// An order is a ticket on the board: a recipe, a customer, and a
// countdown. This module owns spawning, ticking and expiring orders;
// it knows nothing about drawing or input.

import {
  MAX_ORDERS,
  ORDER_TIME_MIN,
  ORDER_TIME_START,
  ORDER_TIME_STEP_PER_LEVEL,
  SPAWN_MIN_SECONDS,
  SPAWN_START_SECONDS,
  SPAWN_STEP_PER_LEVEL,
} from './config.js';
import { RECIPES } from './ingredients.js';

let nextOrderNumber = 1;

const CUSTOMERS = [
  { name: 'Mira', skin: '#f2c89b', hair: '#3b2a1a' },
  { name: 'Budi', skin: '#d9a066', hair: '#14100c' },
  { name: 'Sari', skin: '#e8b48a', hair: '#5b2d1e' },
  { name: 'Tono', skin: '#c98d5f', hair: '#241a12' },
  { name: 'Lia', skin: '#f6d3ae', hair: '#6b3fa0' },
  { name: 'Raka', skin: '#e0aa7e', hair: '#0f2a1a' },
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function makeOrder(level, nowSeconds) {
  const recipe = pickRandom(RECIPES);
  const wait = Math.max(
    ORDER_TIME_MIN,
    ORDER_TIME_START - ORDER_TIME_STEP_PER_LEVEL * (level - 1),
  );
  return {
    id: nextOrderNumber,
    number: nextOrderNumber,
    customer: pickRandom(CUSTOMERS),
    recipe,
    timeLeft: wait,
    timeTotal: wait,
    bornAt: nowSeconds,
    // A short pop animation when the ticket lands on the board.
    pop: 1,
  };
}

export class OrderBoard {
  constructor() {
    this.orders = [];
    this.spawnIn = 2.5;
    this.level = 1;
    nextOrderNumber = 1;
  }

  setLevel(level) {
    this.level = level;
  }

  spawnGap() {
    return Math.max(
      SPAWN_MIN_SECONDS,
      SPAWN_START_SECONDS - SPAWN_STEP_PER_LEVEL * (this.level - 1),
    );
  }

  // Push a fresh ticket onto the board if there is room.
  spawn(nowSeconds) {
    if (this.orders.length >= MAX_ORDERS) return null;
    const order = makeOrder(this.level, nowSeconds);
    nextOrderNumber += 1;
    this.orders.push(order);
    return order;
  }

  // Advance every countdown. Returns the orders that just ran out.
  tick(dt, nowSeconds) {
    const expired = [];
    for (const order of this.orders) {
      order.timeLeft -= dt;
      if (order.pop > 0) order.pop = Math.max(0, order.pop - dt * 3);
      if (order.timeLeft <= 0) expired.push(order);
    }
    if (expired.length > 0) {
      const gone = new Set(expired.map((order) => order.id));
      this.orders = this.orders.filter((order) => !gone.has(order.id));
    }
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawn(nowSeconds);
      this.spawnIn = this.spawnGap();
    }
    return expired;
  }

  remove(orderId) {
    const index = this.orders.findIndex((order) => order.id === orderId);
    if (index === -1) return null;
    const [order] = this.orders.splice(index, 1);
    return order;
  }

  find(orderId) {
    return this.orders.find((order) => order.id === orderId) ?? null;
  }

  // The first ticket whose recipe the plate satisfies, if any.
  firstMatching(plateItems, matches) {
    return this.orders.find((order) => matches(plateItems, order.recipe)) ?? null;
  }

  // The ticket closest to running out, or null when the board is empty.
  earliest() {
    if (this.orders.length === 0) return null;
    return this.orders.reduce((soonest, order) =>
      order.timeLeft < soonest.timeLeft ? order : soonest,
    );
  }
}
