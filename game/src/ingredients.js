// Sizzle & Serve — ingredients and recipes.
// An ingredient is a small record: its id, the name the player reads,
// the key that grabs it from the counter, whether it needs the chopping
// board, whether it needs the grill, and the colours the renderer uses
// to draw it. A recipe is a dish name plus the multiset of ingredient
// ids that builds it. All names are invented for this game.

export const INGREDIENTS = {
  bread: {
    id: 'bread',
    name: 'Bun',
    key: '1',
    needsChop: false,
    needsGrill: false,
    color: '#e8b25c',
    dark: '#b97f2e',
    label: 'BUN',
  },
  pattyRaw: {
    id: 'pattyRaw',
    name: 'Raw Patty',
    key: '2',
    needsChop: false,
    needsGrill: true,
    color: '#c96f6f',
    dark: '#8f3d3d',
    label: 'PATTY',
  },
  patty: {
    id: 'patty',
    name: 'Grilled Patty',
    key: null,
    needsChop: false,
    needsGrill: false,
    color: '#7a4a21',
    dark: '#4d2c10',
    label: 'PATTY',
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    key: '3',
    needsChop: true,
    needsGrill: false,
    color: '#e14b3a',
    dark: '#9c2418',
    label: 'TOMATO',
  },
  tomatoChopped: {
    id: 'tomatoChopped',
    name: 'Tomato Slices',
    key: null,
    needsChop: false,
    needsGrill: false,
    color: '#ef6a55',
    dark: '#b03324',
    label: 'TOMATO',
  },
  lettuce: {
    id: 'lettuce',
    name: 'Lettuce',
    key: '4',
    needsChop: true,
    needsGrill: false,
    color: '#5da244',
    dark: '#33691e',
    label: 'LETTUCE',
  },
  lettuceChopped: {
    id: 'lettuceChopped',
    name: 'Shredded Lettuce',
    key: null,
    needsChop: false,
    needsGrill: false,
    color: '#7cbf5f',
    dark: '#4a7d33',
    label: 'LETTUCE',
  },
  cheese: {
    id: 'cheese',
    name: 'Cheese',
    key: '5',
    needsChop: false,
    needsGrill: false,
    color: '#f5c542',
    dark: '#c08a12',
    label: 'CHEESE',
  },
  onion: {
    id: 'onion',
    name: 'Onion',
    key: '6',
    needsChop: true,
    needsGrill: false,
    color: '#f2e8f5',
    dark: '#9a7fa8',
    label: 'ONION',
  },
  onionChopped: {
    id: 'onionChopped',
    name: 'Onion Rings',
    key: null,
    needsChop: false,
    needsGrill: false,
    color: '#e8d5f0',
    dark: '#8a6a99',
    label: 'ONION',
  },
};

// The bins on the counter, in the order they are drawn and keyed.
export const COUNTER_BINS = [
  'bread',
  'pattyRaw',
  'tomato',
  'lettuce',
  'cheese',
  'onion',
];

// Chopping a raw vegetable yields its chopped form.
export const CHOP_RESULT = {
  tomato: 'tomatoChopped',
  lettuce: 'lettuceChopped',
  onion: 'onionChopped',
};

// Grilling a raw patty yields a grilled one.
export const GRILL_RESULT = {
  pattyRaw: 'patty',
};

// The menu: every dish the customers can order.
export const RECIPES = [
  {
    id: 'garden-burger',
    name: 'Garden Burger',
    items: ['bread', 'patty', 'lettuceChopped', 'tomatoChopped'],
    price: 100,
  },
  {
    id: 'cheesy-melt',
    name: 'Cheesy Melt',
    items: ['bread', 'patty', 'cheese'],
    price: 90,
  },
  {
    id: 'fresh-salad',
    name: 'Fresh Salad',
    items: ['lettuceChopped', 'tomatoChopped', 'onionChopped'],
    price: 80,
  },
  {
    id: 'double-stack',
    name: 'Double Stack',
    items: ['bread', 'patty', 'patty', 'cheese', 'onionChopped'],
    price: 140,
  },
];

export function ingredientById(id) {
  return INGREDIENTS[id] ?? null;
}

export function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id) ?? null;
}

// True when the plate's items are exactly the recipe's items,
// counting duplicates, in any order.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const wanted = [...recipe.items].sort();
  const given = [...plateItems].sort();
  return wanted.every((item, index) => item === given[index]);
}

// A one-line menu listing, e.g. "Garden Burger: Bun + Grilled Patty +
// Shredded Lettuce + Tomato Slices" — used by the help screen.
export function recipeSummary(recipe) {
  const names = recipe.items.map((id) => ingredientById(id)?.name ?? id);
  return `${recipe.name}: ${names.join(' + ')}`;
}
