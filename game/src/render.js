// Sizzle & Serve — everything the player sees, drawn on one canvas.
// The renderer reads the game state and paints it: the kitchen, the
// order board, the counter bins, the stations, the hand and the score
// popups. It never changes state; main.js owns that. All food is drawn
// as vector shapes, so the game ships no image files at all.

import { CANVAS_HEIGHT, CANVAS_WIDTH, CHOPS_PER_VEGETABLE, SHIFT_SECONDS } from './config.js';
import { COUNTER_BINS, ingredientById, recipeSummary, RECIPES } from './ingredients.js';
import { STATIONS, binRect } from './kitchen.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

// Draw one ingredient as a little vector dish, centred on (cx, cy)
// with radius r. Each kind has its own shape so the board reads at
// a glance even without its label.
export function drawIngredient(ctx, id, cx, cy, r) {
  const item = ingredientById(id);
  if (!item) return;
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bread') {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = item.dark;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.28, r * 0.9, r * 0.3, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.4, -0.15], [0, -0.3], [0.4, -0.12]]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'pattyRaw' || id === 'patty') {
    ctx.fillStyle = item.color;
    roundRect(ctx, -r, -r * 0.45, r * 2, r * 0.9, r * 0.4);
    ctx.fill();
    ctx.fillStyle = item.dark;
    for (const [sx, sy] of [[-0.5, 0], [0, 0.1], [0.5, -0.05]]) {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'tomato' || id === 'tomatoChopped') {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7b8ac';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = item.dark;
    ctx.lineWidth = r * 0.08;
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
      ctx.stroke();
    }
  } else if (id === 'lettuce' || id === 'lettuceChopped') {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.45, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = item.dark;
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, 0);
    ctx.lineTo(r * 0.6, 0);
    ctx.stroke();
  } else if (id === 'cheese') {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(0, -r * 0.8);
    ctx.lineTo(r, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = item.dark;
    for (const [sx, sy] of [[-0.35, 0.15], [0.25, 0.3], [0.05, -0.1]]) {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'onion' || id === 'onionChopped') {
    ctx.strokeStyle = item.dark;
    ctx.lineWidth = r * 0.14;
    for (let k = 0; k < 3; k += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.85 - k * 0.25), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCustomerFace(ctx, customer, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = customer.skin;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = customer.hair;
  ctx.beginPath();
  ctx.arc(0, -r * 0.25, r * 0.95, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.05, r * 0.1, 0, Math.PI * 2);
  ctx.arc(r * 0.35, -r * 0.05, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a3b2e';
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.arc(0, r * 0.2, r * 0.45, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.restore();
}

function drawTimerBar(ctx, x, y, w, h, fraction) {
  ctx.fillStyle = '#3a2c22';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const color = fraction > 0.5 ? '#58b368' : fraction > 0.25 ? '#f5a623' : '#e14b3a';
  ctx.fillStyle = color;
  const inner = Math.max(0, (w - 4) * fraction);
  if (inner > 0) {
    roundRect(ctx, x + 2, y + 2, inner, h - 4, (h - 4) / 2);
    ctx.fill();
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(game) {
    const { ctx } = this;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawKitchenBackdrop(ctx);
    this.drawTopBar(ctx, game);
    this.drawOrderBoard(ctx, game);
    this.drawStations(ctx, game);
    this.drawBins(ctx, game);
    this.drawHand(ctx, game);
    this.drawPopups(ctx, game);
    if (game.phase === 'over') this.drawGameOver(ctx, game);
    if (game.showHelp) this.drawHelp(ctx);
  }

  drawKitchenBackdrop(ctx) {
    // Warm tiled wall above, wooden floor below.
    ctx.fillStyle = '#f7e8c9';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 300);
    ctx.fillStyle = '#f1dcb4';
    for (let y = 0; y < 300; y += 48) {
      for (let x = (y / 48) % 2 === 0 ? 0 : 32; x < CANVAS_WIDTH; x += 64) {
        ctx.fillRect(x, y, 60, 44);
      }
    }
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(0, 300, CANVAS_WIDTH, 14);
    ctx.fillStyle = '#a9743f';
    ctx.fillRect(0, 314, CANVAS_WIDTH, CANVAS_HEIGHT - 314);
    ctx.fillStyle = '#96683a';
    for (let x = 0; x < CANVAS_WIDTH; x += 96) ctx.fillRect(x, 314, 3, CANVAS_HEIGHT - 314);
  }

  drawTopBar(ctx, game) {
    // A dark header band so the white score and timer text read clearly.
    ctx.fillStyle = '#2f2118';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 88);
    text(ctx, 'SIZZLE & SERVE', 24, 34, 30, '#fff3d6', '800');
    text(ctx, 'a tiny kitchen rush', 24, 62, 14, '#e8c98f', '600');
    const scoreX = 470;
    text(ctx, `SCORE  ${game.score}`, scoreX, 30, 26, '#ffffff', '800');
    const combo = game.combo > 1 ? `COMBO x${game.comboMultiplier.toFixed(1)}  (${game.combo})` : 'COMBO —';
    text(ctx, combo, scoreX, 60, 15, game.combo > 1 ? '#ffd76a' : '#cbb59a', '700');
    text(ctx, `LEVEL ${game.level}`, 700, 30, 22, '#ffd76a', '800');
    text(ctx, `served ${game.served}  ·  best combo ${game.bestCombo}`, 700, 60, 14, '#e8c98f', '600');
    // Shift timer: big, and red when the rush is almost over.
    const urgent = game.shiftLeft <= 20;
    text(ctx, 'SHIFT', 960, 24, 13, '#cbb59a', '700', 'center');
    text(
      ctx,
      `${Math.floor(game.shiftLeft / 60)}:${String(Math.floor(game.shiftLeft % 60)).padStart(2, '0')}`,
      960, 52, 30, urgent ? '#ff7a6a' : '#ffffff', '800', 'center',
    );
    drawTimerBar(ctx, 890, 74, 140, 10, Math.max(0, game.shiftLeft / SHIFT_SECONDS));
    text(ctx, game.sound.muted ? 'M — sound off' : 'M — sound on', 1180, 30, 13, '#cbb59a', '600', 'right');
    text(ctx, 'H — help', 1180, 54, 13, '#cbb59a', '600', 'right');
  }

  drawOrderBoard(ctx, game) {
    // The board the tickets hang on.
    ctx.fillStyle = '#4a3220';
    roundRect(ctx, 24, 96, 1232, 128, 14);
    ctx.fill();
    ctx.fillStyle = '#5d4028';
    roundRect(ctx, 30, 102, 1232 - 12, 116, 10);
    ctx.fill();
    text(ctx, 'ORDER BOARD', 44, 122, 15, '#e8c98f', '800');
    if (game.board.orders.length === 0) {
      text(ctx, 'No orders yet — the lunch rush is coming…', 200, 170, 18, '#e8c98f', '600');
      return;
    }
    game.board.orders.forEach((order, index) => {
      const x = 200 + index * 262;
      const y = 112;
      const w = 248;
      const h = 100;
      const popScale = 1 + order.pop * 0.12;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(popScale, popScale);
      ctx.translate(-w / 2, -h / 2);
      const urgent = order.timeLeft < 12;
      ctx.fillStyle = urgent ? '#ffe9e2' : '#fff8ea';
      roundRect(ctx, 0, 0, w, h, 10);
      ctx.fill();
      ctx.strokeStyle = urgent ? '#e14b3a' : '#d9b98a';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawCustomerFace(ctx, order.customer, 34, 30, 20);
      text(ctx, `#${order.number} ${order.customer.name}`, 62, 20, 14, '#3b2a1a', '800');
      text(ctx, order.recipe.name, 62, 42, 16, '#8a4a1a', '800');
      order.recipe.items.forEach((itemId, i) => {
        drawIngredient(ctx, itemId, 22 + i * 34, 74, 13);
      });
      const fraction = Math.max(0, order.timeLeft / order.timeTotal);
      drawTimerBar(ctx, 10, 88, w - 20, 8, fraction);
      text(ctx, `${Math.ceil(order.timeLeft)}s`, w - 12, 66, 13, urgent ? '#c0392b' : '#7a5a3a', '800', 'right');
      ctx.restore();
    });
  }

  drawStations(ctx, game) {
    this.drawStationShell(ctx, STATIONS.board, game.hover === 'board');
    text(ctx, 'CHOP  ×3 clicks', STATIONS.board.x + 150, STATIONS.board.y + 132, 13, '#6b4a2a', '700', 'center');
    if (game.kitchen.board) {
      drawIngredient(ctx, game.kitchen.board.id, STATIONS.board.x + 150, STATIONS.board.y + 62, 42);
      text(
        ctx,
        `${game.kitchen.board.chops}/${CHOPS_PER_VEGETABLE}`,
        STATIONS.board.x + 150, STATIONS.board.y + 112, 16, '#3b2a1a', '800', 'center',
      );
    } else {
      ctx.fillStyle = '#d9c49a';
      ctx.beginPath();
      ctx.ellipse(150 + STATIONS.board.x, STATIONS.board.y + 62, 90, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'drop a veggie here', STATIONS.board.x + 150, STATIONS.board.y + 66, 14, '#8a6a45', '600', 'center');
    }

    this.drawStationShell(ctx, STATIONS.grill, game.hover === 'grill');
    text(ctx, 'GRILL  6s', STATIONS.grill.x + 150, STATIONS.grill.y + 132, 13, '#6b4a2a', '700', 'center');
    if (game.kitchen.grill) {
      drawIngredient(ctx, game.kitchen.grill.id, STATIONS.grill.x + 150, STATIONS.grill.y + 62, 42);
      drawTimerBar(
        ctx, STATIONS.grill.x + 60, STATIONS.grill.y + 108,
        180, 10, game.kitchen.grill.cooked,
      );
      if (game.kitchen.grill.cooked >= 1) {
        text(ctx, 'READY — click to take', STATIONS.grill.x + 150, STATIONS.grill.y + 88, 13, '#2e7d32', '800', 'center');
      }
    } else {
      ctx.strokeStyle = '#4a4a4a';
      ctx.lineWidth = 4;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(STATIONS.grill.x + 40 + i * 55, STATIONS.grill.y + 34);
        ctx.lineTo(STATIONS.grill.x + 40 + i * 55, STATIONS.grill.y + 56);
        ctx.stroke();
      }
      text(ctx, 'drop a raw patty here', STATIONS.grill.x + 150, STATIONS.grill.y + 84, 14, '#8a6a45', '600', 'center');
    }

    this.drawStationShell(ctx, STATIONS.plate, game.hover === 'plate', game.plateReady);
    text(ctx, 'PLATE — click to add', STATIONS.plate.x + 150, STATIONS.plate.y + 132, 13, '#6b4a2a', '700', 'center');
    if (game.kitchen.plate.length === 0) {
      ctx.fillStyle = '#f4f4f4';
      ctx.beginPath();
      ctx.ellipse(STATIONS.plate.x + 150, STATIONS.plate.y + 66, 92, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9c9c9';
      ctx.lineWidth = 3;
      ctx.stroke();
      text(ctx, 'empty plate', STATIONS.plate.x + 150, STATIONS.plate.y + 66, 14, '#9a9a9a', '600', 'center');
    } else {
      // Stack the plated ingredients like a little tower of food.
      game.kitchen.plate.forEach((itemId, i) => {
        drawIngredient(ctx, itemId, STATIONS.plate.x + 150, STATIONS.plate.y + 96 - i * 16, 30);
      });
      if (game.plateReady) {
        text(ctx, 'READY TO SERVE!', STATIONS.plate.x + 150, STATIONS.plate.y + 22, 15, '#2e7d32', '800', 'center');
      }
    }

    this.drawStationShell(ctx, STATIONS.trash, game.hover === 'trash');
    text(ctx, '🗑', STATIONS.trash.x + 70, STATIONS.trash.y + 58, 40, '#5d4037', '400', 'center');
    text(ctx, 'TRASH', STATIONS.trash.x + 70, STATIONS.trash.y + 118, 13, '#6b4a2a', '700', 'center');

    this.drawStationShell(ctx, STATIONS.bell, game.hover === 'bell');
    text(ctx, '🔔', STATIONS.bell.x + 70, STATIONS.bell.y + 40, 34, '#8a6a1a', '400', 'center');
    text(ctx, 'SERVE', STATIONS.bell.x + 70, STATIONS.bell.y + 74, 14, '#6b4a2a', '800', 'center');
  }

  drawStationShell(ctx, rect, hovered, ready = false) {
    ctx.fillStyle = ready ? '#e8f5d8' : hovered ? '#ffe9b8' : '#fff3d6';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    ctx.strokeStyle = ready ? '#58b368' : '#c9a86a';
    ctx.lineWidth = ready ? 3 : 2;
    ctx.stroke();
  }

  drawBins(ctx, game) {
    text(ctx, 'COUNTER — click a bin or press 1–6 to grab', 640, 540, 15, '#fff3d6', '700', 'center');
    COUNTER_BINS.forEach((ingredientId, index) => {
      const rect = binRect(index);
      const item = ingredientById(ingredientId);
      const hovered = game.hover === `bin-${ingredientId}`;
      ctx.fillStyle = hovered ? '#ffe9b8' : '#e8d5ae';
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
      ctx.fill();
      ctx.strokeStyle = '#a9743f';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawIngredient(ctx, ingredientId, rect.x + rect.w / 2, rect.y + 34, 24);
      text(ctx, item.name, rect.x + rect.w / 2, rect.y + 70, 14, '#3b2a1a', '800', 'center');
      text(ctx, `[${item.key}]`, rect.x + rect.w / 2, rect.y + 86, 12, '#8a6a45', '700', 'center');
    });
  }

  drawHand(ctx, game) {
    const x = 640;
    const y = 688;
    if (game.kitchen.hand) {
      const item = ingredientById(game.kitchen.hand);
      drawIngredient(ctx, game.kitchen.hand, x - 90, y, 16);
      text(ctx, `IN HAND: ${item.name}  —  click the board, grill or plate`, x - 66, y, 16, '#ffffff', '700');
    } else if (game.kitchen.flash && game.now < game.kitchen.flashUntil) {
      text(ctx, game.kitchen.flash, x, y, 16, '#ffd76a', '700', 'center');
    } else {
      text(ctx, 'Hands empty — grab an ingredient from the counter', x, y, 16, '#e8c98f', '600', 'center');
    }
  }

  drawPopups(ctx, game) {
    for (const popup of game.popups) {
      const age = game.now - popup.bornAt;
      const alpha = Math.max(0, 1 - age / 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      text(ctx, popup.text, popup.x, popup.y - age * 34, 22, popup.color, '800', 'center');
      ctx.restore();
    }
  }

  drawGameOver(ctx, game) {
    ctx.fillStyle = 'rgba(20, 12, 6, 0.72)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff8ea';
    roundRect(ctx, 340, 150, 600, 420, 18);
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, 'SHIFT OVER!', 640, 210, 44, '#8a4a1a', '800', 'center');
    text(ctx, `You served ${game.served} dishes and scored`, 640, 268, 20, '#5d4037', '600', 'center');
    text(ctx, `${game.score} points`, 640, 318, 40, '#2e7d32', '800', 'center');
    text(ctx, `Best combo x${game.bestComboMultiplier.toFixed(1)}  ·  Level ${game.level}`, 640, 372, 18, '#5d4037', '700', 'center');
    text(ctx, game.score >= 800 ? 'Head chef material! The rush never stood a chance.' : game.score >= 400 ? 'A solid shift — the lunch crowd went home happy.' : 'A quiet shift. Chop faster, grill sooner, serve hotter!', 640, 420, 16, '#8a6a45', '600', 'center');
    ctx.fillStyle = '#2e7d32';
    roundRect(ctx, 490, 460, 300, 56, 12);
    ctx.fill();
    text(ctx, 'PLAY AGAIN  (R)', 640, 489, 20, '#ffffff', '800', 'center');
  }

  drawHelp(ctx) {
    ctx.fillStyle = 'rgba(20, 12, 6, 0.78)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff8ea';
    roundRect(ctx, 290, 100, 700, 550, 18);
    ctx.fill();
    text(ctx, 'HOW TO PLAY', 640, 150, 36, '#8a4a1a', '800', 'center');
    const lines = [
      '1. Read the ORDER BOARD — each ticket is a dish with a timer.',
      '2. Grab ingredients from the counter (click, or keys 1–6).',
      '3. Chop veggies on the board (3 clicks). Grill patties (6s).',
      '4. Stack the dish on the plate — click the plate to add.',
      '5. Click a ticket (or the bell) to serve the matching dish.',
      '',
      'Serve fast for a time bonus. Chain serves to build a combo.',
      'Let a ticket run out and the customer walks — combo lost.',
      '',
      'THE MENU',
      ...RECIPES.map((recipe) => recipeSummary(recipe)),
      '',
      'Keys: 1–6 grab · C chop · G grill · P plate · B bell ·',
      'Backspace trash · M mute · H help · R restart',
    ];
    lines.forEach((line, i) => {
      text(ctx, line, 640, 192 + i * 24, line === 'THE MENU' ? 18 : 17, line === 'THE MENU' ? '#8a4a1a' : '#3b2a1a', line === 'THE MENU' ? '800' : '600', 'center');
    });
    text(ctx, 'Press H or click anywhere to close', 640, 622, 15, '#8a6a45', '600', 'center');
  }
}
