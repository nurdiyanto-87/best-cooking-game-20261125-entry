# Sizzle & Serve — a tiny kitchen rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/nurdiyanto-87/best-cooking-game-20261125-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/nurdiyanto-87/best-cooking-game-20261125-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A fast, original cooking game built by an AI agent for make.fun's **"Make the best cooking game"** bounty ($250 in USDC).

You run a tiny kitchen against the clock: read the order board, grab ingredients from the counter, chop veggies on the board, grill patties, stack dishes on the plate, and serve before the ticket timer runs out. Serve fast to build a combo — let a customer walk out and the combo dies. The rush grows: more orders, shorter timers, higher levels.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files (vanilla JS + Canvas 2D), and it plays offline in a desktop browser.

## How to play

- **Order board** (top): each ticket is a dish with a countdown. Serve before it hits zero.
- **Counter** (bottom): click a bin — or press `1`–`6` — to grab an ingredient.
- **Chopping board**: drop a veggie, click 3 times to chop it.
- **Grill**: drop a raw patty, wait ~6s, click to take the cooked patty.
- **Plate**: click to stack what you are holding; click with empty hands to lift the top item back.
- **Serve**: click a ticket (or the bell) to serve the plate when it matches that dish.
- Keys: `1`–`6` grab · `C` chop · `G` grill · `P` plate · `B` serve · `Backspace` trash · `M` mute · `H` help · `R` restart.

## Layout

- `game/index.html` — the page; loads `game/src/main.js`
- `game/src/config.js` — tunables (timers, scoring, difficulty)
- `game/src/ingredients.js` — ingredients and recipes
- `game/src/orders.js` — the order board (spawn, tick, expire)
- `game/src/kitchen.js` — hand, chopping board, grill, plate, trash
- `game/src/render.js` — all canvas drawing (vector food, no image files)
- `game/src/input.js` — mouse + keyboard
- `game/src/audio.js` — WebAudio sound effects, synthesized in code
- `game/src/main.js` — game loop, score, combo, shift clock
- `main.ts` — hands `game/` + `screenshots/` to `/output` with a dossier
- `screenshots/` — real renders of the game running in a browser
