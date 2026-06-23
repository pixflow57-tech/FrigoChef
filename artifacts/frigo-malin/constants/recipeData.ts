export type RecipeMode =
  | "anti-gaspillage"
  | "rapide"
  | "végétarien"
  | "vegan"
  | "sportif"
  | "famille"
  | "gourmet"
  | "économique";

export type Difficulty = 1 | 2 | 3;

export interface RecipeIngredient {
  name: string;
  quantity: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  modes: RecipeMode[];
  nutritionScore: number;
  antiWasteScore: number;
  imageKey: "pasta" | "salad" | "hero" | null;
  /** ingredient category tags for category-level matching */
  tags?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart scoring engine
// ─────────────────────────────────────────────────────────────────────────────

/** Strip accents, lowercase, trim */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Synonym groups — any member of a group matches any other */
const SYNONYM_GROUPS: string[][] = [
  // Eggs
  ["oeuf", "oeufs", "egg", "eggs"],
  // Pasta
  ["pate", "pates", "spaghetti", "tagliatelle", "penne", "fusilli", "macaroni", "nouille", "nouilles", "pasta", "linguine", "rigatoni", "farfalle"],
  // Tomato
  ["tomate", "tomates", "tomate cerise", "tomates cerises", "concentre de tomate"],
  // Onion
  ["oignon", "oignons", "echalote", "echalotes"],
  // Garlic
  ["ail", "gousses d ail"],
  // Carrot
  ["carotte", "carottes"],
  // Potato
  ["pomme de terre", "pommes de terre", "patate", "patates"],
  // Zucchini
  ["courgette", "courgettes"],
  // Bell pepper
  ["poivron", "poivrons", "capsicum"],
  // Mushroom
  ["champignon", "champignons", "champignon de paris", "champignons de paris"],
  // Chicken
  ["poulet", "blanc de poulet", "cuisse de poulet", "aiguillette de poulet", "filet de poulet"],
  // Beef
  ["boeuf", "steak", "viande hachee", "hachis", "bavette", "entrecote"],
  // Pork
  ["porc", "lardons", "bacon", "jambon", "cote de porc", "saucisse", "chorizo"],
  // Rice
  ["riz", "riz basmati", "riz rond"],
  // Cheese
  ["fromage", "fromage rape", "gruyere", "emmental", "parmesan", "comte", "mozzarella", "feta", "camembert", "brie", "chevre"],
  // Cream
  ["creme", "creme fraiche", "creme liquide", "creme entiere"],
  // Butter
  ["beurre"],
  // Milk
  ["lait", "lait entier", "lait demi-ecreme"],
  // Flour
  ["farine", "farine de ble"],
  // Tuna
  ["thon", "thon en boite", "thon emiette"],
  // Salmon
  ["saumon", "saumon fume", "pavé de saumon"],
  // Shrimp
  ["crevette", "crevettes", "gambas"],
  // Lentils
  ["lentille", "lentilles", "lentilles vertes", "lentilles corail"],
  // Chickpeas
  ["pois chiche", "pois chiches"],
  // Eggplant
  ["aubergine", "aubergines"],
  // Spinach
  ["epinard", "epinards"],
  // Leek
  ["poireau", "poireaux"],
  // Cucumber
  ["concombre", "concombres"],
  // Avocado
  ["avocat", "avocats"],
  // Banana
  ["banane", "bananes"],
  // Apple
  ["pomme", "pommes"],
  // Lemon
  ["citron", "citrons", "jus de citron"],
  // Yogurt
  ["yaourt", "yaourts", "yogourt", "yaourt grec"],
  // Tomato sauce / passata
  ["sauce tomate", "coulis de tomate", "passata"],
  // Herbs generic
  ["persil", "coriandre", "basilic", "thym", "romarin", "menthe", "ciboulette", "herbes de provence", "herbes fraiches", "fines herbes"],
  // Oil
  ["huile", "huile d olive", "huile de tournesol", "huile de sesame"],
  // Soy sauce
  ["sauce soja", "sauce soja sucree"],
  // Bread
  ["pain", "tranches de pain", "pain de mie", "baguette"],
  // Semolina / couscous
  ["semoule", "couscous"],
  // Coconut milk
  ["lait de coco", "creme de coco"],
  // Tomato paste
  ["concentre de tomate", "double concentre de tomate"],
];

/** Build a fast lookup: normalize(word) → group index */
const WORD_TO_GROUP: Map<string, number> = new Map();
SYNONYM_GROUPS.forEach((group, idx) => {
  group.forEach((word) => WORD_TO_GROUP.set(normalize(word), idx));
});

/** Category tags for broad matching */
const CATEGORY_TAGS: Record<string, string[]> = {
  proteine: ["poulet", "boeuf", "porc", "thon", "saumon", "crevette", "oeuf", "lardons", "jambon", "sardine", "maquereau", "pois chiche", "lentille", "tofu"],
  viande: ["poulet", "boeuf", "porc", "lardons", "jambon", "saucisse", "chorizo"],
  poisson: ["thon", "saumon", "crevette", "sardine", "maquereau", "cabillaud", "truite"],
  legume: ["tomate", "courgette", "carotte", "poivron", "champignon", "epinard", "aubergine", "brocoli", "chou", "poireau", "salade", "concombre", "celeri", "betterave", "fenouil", "haricot", "petit pois", "mais", "avocat", "asperge", "artichaut", "navets", "radis", "oignon", "ail"],
  feculent: ["pate", "riz", "pomme de terre", "semoule", "pain", "farine", "quinoa", "lentille", "boulgour", "polenta"],
  produit_laitier: ["fromage", "creme", "beurre", "lait", "yaourt"],
  fruit: ["pomme", "poire", "banane", "orange", "citron", "fraise", "framboise", "mangue", "ananas", "kiwi", "raisin", "peche", "abricot", "cerise", "melon", "pastèque", "myrtille"],
};

function getNormalizedTokens(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

function matchIngredients(fridgeItem: string, recipeItem: string): boolean {
  const fn = normalize(fridgeItem);
  const rn = normalize(recipeItem);

  // Direct contains match
  if (fn.includes(rn) || rn.includes(fn)) return true;

  // Word-level overlap
  const fTokens = getNormalizedTokens(fn);
  const rTokens = getNormalizedTokens(rn);
  for (const rt of rTokens) {
    if (rt.length < 3) continue;
    for (const ft of fTokens) {
      if (ft.length < 3) continue;
      if (ft.includes(rt) || rt.includes(ft)) return true;
    }
  }

  // Synonym group match
  const fGroup = WORD_TO_GROUP.get(fn) ?? fTokens.map(t => WORD_TO_GROUP.get(t)).find(g => g !== undefined);
  const rGroup = WORD_TO_GROUP.get(rn) ?? rTokens.map(t => WORD_TO_GROUP.get(t)).find(g => g !== undefined);
  if (fGroup !== undefined && rGroup !== undefined && fGroup === rGroup) return true;

  return false;
}

/** Check if any fridge item satisfies a recipe ingredient by category tag */
function matchByCategory(fridgeItems: string[], recipeTag: string): boolean {
  const categoryWords = CATEGORY_TAGS[recipeTag] ?? [];
  return fridgeItems.some(fi => categoryWords.some(cw => matchIngredients(fi, cw)));
}

/**
 * Score a recipe against fridge contents.
 * Returns 0–100. Never -1.
 * Higher = better match.
 */
export function scoreRecipe(recipe: Recipe, fridgeIngredients: string[]): number {
  if (fridgeIngredients.length === 0) return 50;

  const required = recipe.ingredients.filter((i) => !i.optional);
  const optional = recipe.ingredients.filter((i) => i.optional);

  let requiredHit = 0;
  let optionalHit = 0;

  for (const ing of required) {
    const matched =
      fridgeIngredients.some(fi => matchIngredients(fi, ing.name)) ||
      (recipe.tags ?? []).some(tag => matchByCategory(fridgeIngredients, tag));
    if (matched) requiredHit++;
  }

  for (const ing of optional) {
    const matched = fridgeIngredients.some(fi => matchIngredients(fi, ing.name));
    if (matched) optionalHit++;
  }

  const reqWeight = 70;
  const optWeight = 30;

  const reqScore = required.length > 0 ? (requiredHit / required.length) * reqWeight : reqWeight;
  const optScore = optional.length > 0 ? (optionalHit / optional.length) * optWeight : 0;

  return Math.round(reqScore + optScore);
}

// ─────────────────────────────────────────────────────────────────────────────
// Recipe database — 65 recipes
// ─────────────────────────────────────────────────────────────────────────────

export const RECIPES: Recipe[] = [
  // ── OEUFS ──────────────────────────────────────────────────────────────────
  {
    id: "r1",
    title: "Omelette aux légumes",
    description: "Une omelette savoureuse et rapide avec vos légumes du frigo.",
    tags: ["legume"],
    ingredients: [
      { name: "oeufs", quantity: "3" },
      { name: "poivron", quantity: "1", optional: true },
      { name: "tomate", quantity: "1", optional: true },
      { name: "oignon", quantity: "1" },
      { name: "fromage râpé", quantity: "30g", optional: true },
      { name: "huile d'olive", quantity: "1 c.à.s" },
    ],
    prepTime: 5, cookTime: 10, servings: 2, difficulty: 1,
    modes: ["rapide", "végétarien", "anti-gaspillage", "famille"],
    nutritionScore: 85, antiWasteScore: 90, imageKey: null,
  },
  {
    id: "r2_frittata",
    title: "Frittata aux pommes de terre",
    description: "Une frittata rustique à l'italienne, parfaite pour liquider vos restes.",
    tags: ["legume"],
    ingredients: [
      { name: "oeufs", quantity: "5" },
      { name: "pomme de terre", quantity: "3" },
      { name: "oignon", quantity: "1" },
      { name: "fromage râpé", quantity: "50g", optional: true },
      { name: "persil", quantity: "quelques tiges", optional: true },
      { name: "huile d'olive", quantity: "2 c.à.s" },
    ],
    prepTime: 10, cookTime: 25, servings: 3, difficulty: 2,
    modes: ["végétarien", "économique", "anti-gaspillage", "famille"],
    nutritionScore: 78, antiWasteScore: 90, imageKey: null,
  },
  {
    id: "r2_shakshuka",
    title: "Shakshuka (oeufs en sauce tomate)",
    description: "Des oeufs pochés dans une sauce tomate épicée, un classique du Maghreb.",
    tags: ["legume"],
    ingredients: [
      { name: "oeufs", quantity: "4" },
      { name: "tomate", quantity: "4" },
      { name: "poivron", quantity: "1", optional: true },
      { name: "oignon", quantity: "1" },
      { name: "ail", quantity: "2 gousses" },
      { name: "cumin", quantity: "1 c.à.c", optional: true },
      { name: "paprika", quantity: "1 c.à.c", optional: true },
    ],
    prepTime: 10, cookTime: 20, servings: 2, difficulty: 1,
    modes: ["végétarien", "anti-gaspillage", "famille"],
    nutritionScore: 88, antiWasteScore: 92, imageKey: null,
  },
  {
    id: "r2_oeufs_brouilles",
    title: "Oeufs brouillés crémeux",
    description: "Des oeufs brouillés ultra-crémeux, le petit-déjeuner de chef.",
    ingredients: [
      { name: "oeufs", quantity: "4" },
      { name: "beurre", quantity: "20g" },
      { name: "crème fraîche", quantity: "2 c.à.s", optional: true },
      { name: "ciboulette", quantity: "quelques tiges", optional: true },
      { name: "sel et poivre", quantity: "au goût" },
    ],
    prepTime: 5, cookTime: 8, servings: 2, difficulty: 1,
    modes: ["rapide", "végétarien", "gourmet"],
    nutritionScore: 80, antiWasteScore: 75, imageKey: null,
  },
  {
    id: "r2_quiche",
    title: "Quiche aux légumes et fromage",
    description: "Une quiche maison croustillante garnie de légumes variés.",
    tags: ["legume", "produit_laitier"],
    ingredients: [
      { name: "pâte brisée", quantity: "1" },
      { name: "oeufs", quantity: "3" },
      { name: "crème fraîche", quantity: "20cl" },
      { name: "courgette", quantity: "1", optional: true },
      { name: "champignon", quantity: "200g", optional: true },
      { name: "fromage râpé", quantity: "100g" },
      { name: "lardons", quantity: "100g", optional: true },
    ],
    prepTime: 20, cookTime: 35, servings: 4, difficulty: 2,
    modes: ["famille", "gourmet", "anti-gaspillage"],
    nutritionScore: 75, antiWasteScore: 80, imageKey: null,
  },

  // ── PÂTES ──────────────────────────────────────────────────────────────────
  {
    id: "r3_pasta_tomate",
    title: "Pâtes à la sauce tomate fraîche",
    description: "Des pâtes al dente avec une sauce tomate maison parfumée au basilic.",
    tags: ["legume"],
    ingredients: [
      { name: "pâtes", quantity: "200g" },
      { name: "tomate", quantity: "4" },
      { name: "ail", quantity: "2 gousses" },
      { name: "basilic", quantity: "quelques feuilles", optional: true },
      { name: "huile d'olive", quantity: "2 c.à.s" },
      { name: "parmesan", quantity: "30g", optional: true },
    ],
    prepTime: 10, cookTime: 20, servings: 2, difficulty: 1,
    modes: ["végétarien", "économique", "famille", "anti-gaspillage"],
    nutritionScore: 70, antiWasteScore: 85, imageKey: "pasta",
  },
  {
    id: "r3_pasta_ail",
    title: "Pasta aglio e olio",
    description: "Les pâtes les plus simples du monde : ail, huile, piment. Prêtes en 15 min.",
    ingredients: [
      { name: "pâtes", quantity: "200g" },
      { name: "ail", quantity: "4 gousses" },
      { name: "huile d'olive", quantity: "5 c.à.s" },
      { name: "persil", quantity: "1 bouquet", optional: true },
      { name: "piment", quantity: "1", optional: true },
      { name: "parmesan", quantity: "30g", optional: true },
    ],
    prepTime: 5, cookTime: 12, servings: 2, difficulty: 1,
    modes: ["rapide", "végétarien", "vegan", "économique"],
    nutritionScore: 62, antiWasteScore: 70, imageKey: null,
  },
  {
    id: "r3_pasta_creme",
    title: "Pâtes à la crème et aux champignons",
    description: "Un classique crémeux et réconfortant prêt en 20 minutes.",
    tags: ["produit_laitier"],
    ingredients: [
      { name: "pâtes", quantity: "200g" },
      { name: "champignon", quantity: "200g" },
      { name: "crème fraîche", quantity: "20cl" },
      { name: "ail", quantity: "1 gousse" },
      { name: "beurre", quantity: "20g" },
      { name: "parmesan", quantity: "30g", optional: true },
    ],
    prepTime: 5, cookTime: 20, servings: 2, difficulty: 1,
    modes: ["végétarien", "rapide", "famille"],
    nutritionScore: 68, antiWasteScore: 78, imageKey: null,
  },
  {
    id: "r3_pasta_thon",
    title: "Pâtes au thon et tomates cerises",
    description: "Pâtes express au thon, tomates et câpres. Rapide et savoureux.",
    ingredients: [
      { name: "pâtes", quantity: "200g" },
      { name: "thon", quantity: "1 boîte" },
      { name: "tomate", quantity: "200g" },
      { name: "câpres", quantity: "1 c.à.s", optional: true },
      { name: "ail", quantity: "1 gousse", optional: true },
      { name: "huile d'olive", quantity: "2 c.à.s" },
    ],
    prepTime: 5, cookTime: 15, servings: 2, difficulty: 1,
    modes: ["rapide", "économique", "anti-gaspillage", "sportif"],
    nutritionScore: 82, antiWasteScore: 85, imageKey: null,
  },
  {
    id: "r3_pasta_poulet",
    title: "Pâtes au poulet et légumes",
    description: "Pâtes sautées au poulet, légumes de saison et parmesan.",
    tags: ["legume"],
    ingredients: [
      { name: "pâtes", quantity: "200g" },
      { name: "poulet", quantity: "200g" },
      { name: "courgette", quantity: "1", optional: true },
      { name: "poivron", quantity: "1", optional: true },
      { name: "ail", quantity: "2 gousses" },
      { name: "huile d'olive", quantity: "2 c.à.s" },
      { name: "parmesan", quantity: "30g", optional: true },
    ],
    prepTime: 10, cookTime: 20, servings: 2, difficulty: 1,
    modes: ["famille", "sportif", "anti-gaspillage"],
    nutritionScore: 80, antiWasteScore: 85, imageKey: null,
  },
  {
    id: "r3_pasta_bolognaise",
    title: "Bolognaise maison",
    description: "La vraie bolognaise qui mijote, avec de la viande hachée et des tomates.",
    tags: ["viande"],
    ingredients: [
      { name: "pâtes", quantity: "300g" },
      { name: "viande hachée", quantity: "300g" },
      { name: "tomate", quantity: "400g" },
      { name: "oignon", quantity: "1" },
      { name: "ail", quantity: "2 gousses" },
      { name: "concentré de tomate", quantity: "1 c.à.s" },
      { name: "carotte", quantity: "1", optional: true },
    ],
    prepTime: 15, cookTime: 30, servings: 4, difficulty: 2,
    modes: ["famille", "économique"],
    nutritionScore: 75, antiWasteScore: 78, imageKey: "pasta",
  },
  {
    id: "r3_pasta_carbonara",
    title: "Pâtes carbonara légères",
    description: "Une version allégée de la carbonara avec lardons et crème.",
    ingredients: [
      { name: "pâtes", quantity: "200g" },
      { name: "lardons", quantity: "150g" },
      { name: "oeufs", quantity: "2" },
      { name: "crème fraîche", quantity: "10cl" },
      { name: "parmesan", quantity: "50g", optional: true },
      { name: "poivre", quantity: "au goût" },
    ],
    prepTime: 5, cookTime: 15, servings: 2, difficulty: 1,
    modes: ["rapide", "famille"],
    nutritionScore: 65, antiWasteScore: 70, imageKey: null,
  },

  // ── RIZ ────────────────────────────────────────────────────────────────────
  {
    id: "r4_riz_saute",
    title: "Riz sauté aux légumes",
    description: "Riz sauté aux légumes de saison, sauce soja et sésame.",
    tags: ["legume"],
    ingredients: [
      { name: "riz", quantity: "200g" },
      { name: "carotte", quantity: "2", optional: true },
      { name: "poivron", quantity: "1", optional: true },
      { name: "courgette", quantity: "1", optional: true },
      { name: "oeufs", quantity: "2", optional: true },
      { name: "sauce soja", quantity: "2 c.à.s" },
      { name: "ail", quantity: "2 gousses" },
    ],
    prepTime: 10, cookTime: 20, servings: 2, difficulty: 2,
    modes: ["végétarien", "vegan", "anti-gaspillage", "économique"],
    nutritionScore: 80, antiWasteScore: 92, imageKey: null,
  },
  {
    id: "r4_riz_poulet",
    title: "Riz pilaf au poulet",
    description: "Un riz pilaf parfumé au poulet et aux épices douces.",
    ingredients: [
      { name: "riz", quantity: "200g" },
      { name: "poulet", quantity: "300g" },
      { name: "oignon", quantity: "1" },
      { name: "ail", quantity: "2 gousses" },
      { name: "bouillon", quantity: "400ml" },
      { name: "curcuma", quantity: "1 c.à.c", optional: true },
    ],
    prepTime: 10, cookTime: 25, servings: 3, difficulty: 1,
    modes: ["famille", "économique", "sportif"],
    nutritionScore: 85, antiWasteScore: 78, imageKey: null,
  },
  {
    id: "r4_risotto",
    title: "Risotto crémeux aux champignons",
    description: "Un risotto onctueux, préparé avec patience et beaucoup d'amour.",
    ingredients: [
      { name: "riz", quantity: "300g" },
      { name: "champignon", quantity: "200g" },
      { name: "oignon", quantity: "1" },
      { name: "bouillon", quantity: "1L" },
      { name: "beurre", quantity: "40g" },
      { name: "parmesan", quantity: "60g", optional: true },
      { name: "vin blanc", quantity: "10cl", optional: true },
    ],
    prepTime: 10, cookTime: 30, servings: 3, difficulty: 3,
    modes: ["végétarien", "gourmet"],
    nutritionScore: 72, antiWasteScore: 75, imageKey: null,
  },
  {
    id: "r4_paella",
    title: "Paella express poulet-légumes",
    description: "Une paella simplifiée pleine de couleurs et de saveurs.",
    tags: ["legume"],
    ingredients: [
      { name: "riz", quantity: "300g" },
      { name: "poulet", quantity: "300g", optional: true },
      { name: "poivron", quantity: "2" },
      { name: "tomate", quantity: "2" },
      { name: "oignon", quantity: "1" },
      { name: "safran", quantity: "1 pincée", optional: true },
      { name: "paprika", quantity: "1 c.à.c", optional: true },
      { name: "bouillon", quantity: "600ml" },
    ],
    prepTime: 15, cookTime: 30, servings: 4, difficulty: 2,
    modes: ["famille", "anti-gaspillage"],
    nutritionScore: 82, antiWasteScore: 85, imageKey: null,
  },

  // ── POULET ─────────────────────────────────────────────────────────────────
  {
    id: "r5_poulet_herbes",
    title: "Poulet rôti aux herbes",
    description: "Un poulet tendre et parfumé aux herbes, pommes de terre et ail.",
    tags: ["legume"],
    ingredients: [
      { name: "poulet", quantity: "1" },
      { name: "pomme de terre", quantity: "4" },
      { name: "ail", quantity: "4 gousses" },
      { name: "romarin", quantity: "2 branches", optional: true },
      { name: "thym", quantity: "2 branches", optional: true },
      { name: "huile d'olive", quantity: "3 c.à.s" },
      { name: "citron", quantity: "1", optional: true },
    ],
    prepTime: 15, cookTime: 60, servings: 4, difficulty: 2,
    modes: ["famille", "gourmet", "sportif"],
    nutritionScore: 90, antiWasteScore: 70, imageKey: null,
  },
  {
    id: "r5_poulet_curry",
    title: "Curry de poulet au lait de coco",
    description: "Un curry parfumé et crémeux, prêt en 30 minutes.",
    ingredients: [
      { name: "poulet", quantity: "400g" },
      { name: "lait de coco", quantity: "400ml" },
      { name: "oignon", quantity: "1" },
      { name: "ail", quantity: "2 gousses" },
      { name: "curry", quantity: "2 c.à.s" },
      { name: "tomate", quantity: "2", optional: true },
      { name: "riz", quantity: "200g", optional: true },
    ],
    prepTime: 10, cookTime: 25, servings: 3, difficulty: 2,
    modes: ["famille", "gourmet", "anti-gaspillage"],
    nutritionScore: 86, antiWasteScore: 80, imageKey: null,
  },
  {
    id: "r5_poulet_citron",
    title: "Poulet au citron et ail",
    description: "Poulet sauté au citron, ail et herbes fraîches, prêt en 20 min.",
    ingredients: [
      { name: "poulet", quantity: "400g" },
      { name: "citron", quantity: "1" },
      { name: "ail", quantity: "3 gousses" },
      { name: "thym", quantity: "quelques branches", optional: true },
      { name: "huile d'olive", quantity: "2 c.à.s" },
    ],
    prepTime: 5, cookTime: 20, servings: 2, difficulty: 1,
    modes: ["rapide", "sportif", "gourmet"],
    nutritionScore: 88, antiWasteScore: 75, imageKey: null,
  },
  {
    id: "r5_poulet_basquaise",
    title: "Poulet à la basquaise",
    description: "Poulet mijoté avec poivrons, tomates et piment d'Espelette.",
    tags: ["legume"],
    ingredients: [
      { name: "poulet", quantity: "600g" },
      { name: "poivron", quantity: "3" },
      { name: "tomate", quantity: "4" },
      { name: "oignon", quantity: "2" },
      { name: "ail", quantity: "3 gousses" },
      { name: "jambon", quantity: "100g", optional: true },
    ],
    prepTime: 20, cookTime: 40, servings: 4, difficulty: 2,
    modes: ["famille", "anti-gaspillage", "gourmet"],
    nutritionScore: 87, antiWasteScore: 88, imageKey: null,
  },

  // ── BOEUF / VIANDE ─────────────────────────────────────────────────────────
  {
    id: "r6_hachis",
    title: "Hachis parmentier",
    description: "Le grand classique : viande hachée et purée de pommes de terre gratinée.",
    ingredients: [
      { name: "viande hachée", quantity: "400g" },
      { name: "pomme de terre", quantity: "800g" },
      { name: "oignon", quantity: "1" },
      { name: "beurre", quantity: "40g" },
      { name: "lait", quantity: "10cl" },
      { name: "fromage râpé", quantity: "80g", optional: true },
    ],
    prepTime: 20, cookTime: 40, servings: 4, difficulty: 2,
    modes: ["famille", "économique", "anti-gaspillage"],
    nutritionScore: 72, antiWasteScore: 85, imageKey: null,
  },
  {
    id: "r6_steak_legumes",
    title: "Steak poêlé et légumes rôtis",
    description: "Steak saignant ou à point, accompagné de légumes de saison.",
    tags: ["legume"],
    ingredients: [
      { name: "boeuf", quantity: "2 steaks" },
      { name: "carotte", quantity: "2", optional: true },
      { name: "pomme de terre", quantity: "3", optional: true },
      { name: "beurre", quantity: "20g" },
      { name: "thym", quantity: "quelques branches", optional: true },
    ],
    prepTime: 10, cookTime: 20, servings: 2, difficulty: 1,
    modes: ["rapide", "sportif", "gourmet"],
    nutritionScore: 88, antiWasteScore: 72, imageKey: null,
  },
  {
    id: "r6_boeuf_bourguignon",
    title: "Boeuf bourguignon",
    description: "Le plat mijoté par excellence, riche et réconfortant.",
    ingredients: [
      { name: "boeuf", quantity: "600g" },
      { name: "carotte", quantity: "3" },
      { name: "oignon", quantity: "2" },
      { name: "champignon", quantity: "200g", optional: true },
      { name: "lardons", quantity: "100g", optional: true },
      { name: "bouillon", quantity: "500ml" },
    ],
    prepTime: 20, cookTime: 90, servings: 4, difficulty: 3,
    modes: ["famille", "gourmet"],
    nutritionScore: 82, antiWasteScore: 75, imageKey: null,
  },
  {
    id: "r6_tacos",
    title: "Tacos de boeuf haché",
    description: "Tacos express au boeuf épicé avec tomate et avocat.",
    tags: ["legume"],
    ingredients: [
      { name: "viande hachée", quantity: "300g" },
      { name: "tortilla", quantity: "4" },
      { name: "tomate", quantity: "2", optional: true },
      { name: "avocat", quantity: "1", optional: true },
      { name: "oignon", quantity: "1" },
      { name: "cumin", quantity: "1 c.à.c", optional: true },
      { name: "fromage râpé", quantity: "60g", optional: true },
    ],
    prepTime: 10, cookTime: 15, servings: 2, difficulty: 1,
    modes: ["rapide", "famille"],
    nutritionScore: 75, antiWasteScore: 78, imageKey: null,
  },

  // ── POISSON ────────────────────────────────────────────────────────────────
  {
    id: "r7_saumon",
    title: "Saumon poêlé citron-ail",
    description: "Filet de saumon doré avec une sauce citron et ail rapide.",
    ingredients: [
      { name: "saumon", quantity: "2 pavés" },
      { name: "citron", quantity: "1" },
      { name: "ail", quantity: "2 gousses" },
      { name: "beurre", quantity: "20g", optional: true },
      { name: "persil", quantity: "quelques tiges", optional: true },
    ],
    prepTime: 5, cookTime: 10, servings: 2, difficulty: 1,
    modes: ["rapide", "gourmet", "sportif"],
    nutritionScore: 92, antiWasteScore: 70, imageKey: null,
  },
  {
    id: "r7_salade_nicoise",
    title: "Salade niçoise",
    description: "La salade du Sud avec thon, oeufs durs, olives et légumes croquants.",
    ingredients: [
      { name: "thon", quantity: "1 boîte" },
      { name: "oeufs", quantity: "3" },
      { name: "tomate", quantity: "2" },
      { name: "salade verte", quantity: "1", optional: true },
      { name: "olive", quantity: "50g", optional: true },
      { name: "anchois", quantity: "6", optional: true },
      { name: "concombre", quantity: "1", optional: true },
    ],
    prepTime: 15, cookTime: 10, servings: 2, difficulty: 1,
    modes: ["rapide", "sportif", "anti-gaspillage"],
    nutritionScore: 90, antiWasteScore: 82, imageKey: "salad",
  },
  {
    id: "r7_curry_crevettes",
    title: "Curry de crevettes au lait de coco",
    description: "Crevettes parfumées dans un curry crémeux, servi avec du riz.",
    ingredients: [
      { name: "crevette", quantity: "300g" },
      { name: "lait de coco", quantity: "400ml" },
      { name: "ail", quantity: "2 gousses" },
      { name: "gingembre", quantity: "1 c.à.c", optional: true },
      { name: "curry", quantity: "1 c.à.s" },
      { name: "riz", quantity: "200g", optional: true },
    ],
    prepTime: 10, cookTime: 20, servings: 2, difficulty: 2,
    modes: ["gourmet", "anti-gaspillage", "rapide"],
    nutritionScore: 88, antiWasteScore: 80, imageKey: null,
  },
  {
    id: "r7_thon_riz",
    title: "Bowl thon, riz et légumes",
    description: "Un bowl sain et rassasiant avec du thon, du riz et des légumes colorés.",
    tags: ["legume"],
    ingredients: [
      { name: "thon", quantity: "1 boîte" },
      { name: "riz", quantity: "150g" },
      { name: "carotte", quantity: "1", optional: true },
      { name: "concombre", quantity: "1", optional: true },
      { name: "sauce soja", quantity: "2 c.à.s", optional: true },
      { name: "avocat", quantity: "1", optional: true },
    ],
    prepTime: 10, cookTime: 15, servings: 1, difficulty: 1,
    modes: ["rapide", "sportif", "anti-gaspillage"],
    nutritionScore: 90, antiWasteScore: 85, imageKey: null,
  },

  // ── LÉGUMES ────────────────────────────────────────────────────────────────
  {
    id: "r8_ratatouille",
    title: "Ratatouille provençale",
    description: "Le grand classique qui valorise vos légumes d'été.",
    ingredients: [
      { name: "courgette", quantity: "2" },
      { name: "aubergine", quantity: "1" },
      { name: "poivron", quantity: "2" },
      { name: "tomate", quantity: "4" },
      { name: "oignon", quantity: "1" },
      { name: "ail", quantity: "3 gousses" },
      { name: "herbes de Provence", quantity: "1 c.à.s" },
    ],
    prepTime: 20, cookTime: 45, servings: 4, difficulty: 2,
    modes: ["végétarien", "vegan", "anti-gaspillage", "gourmet", "famille"],
    nutritionScore: 91, antiWasteScore: 96, imageKey: null,
  },
  {
    id: "r8_curry_legumes",
    title: "Curry de légumes",
    description: "Un curry parfumé et crémeux avec lait de coco et vos légumes.",
    tags: ["legume"],
    ingredients: [
      { name: "carotte", quantity: "2" },
      { name: "pomme de terre", quantity: "2" },
      { name: "oignon", quantity: "1" },
      { name: "lait de coco", quantity: "400ml" },
      { name: "pâte de curry", quantity: "2 c.à.s" },
      { name: "ail", quantity: "2 gousses" },
      { name: "riz", quantity: "200g" },
    ],
    prepTime: 15, cookTime: 30, servings: 3, difficulty: 2,
    modes: ["végétarien", "vegan", "anti-gaspillage", "gourmet"],
    nutritionScore: 82, antiWasteScore: 88, imageKey: null,
  },
  {
    id: "r8_wok",
    title: "Wok de légumes et sauce soja",
    description: "Légumes croquants sautés au wok, sauce soja et sésame.",
    tags: ["legume"],
    ingredients: [
      { name: "carotte", quantity: "2" },
      { name: "poivron", quantity: "1" },
      { name: "courgette", quantity: "1", optional: true },
      { name: "brocoli", quantity: "200g", optional: true },
      { name: "sauce soja", quantity: "3 c.à.s" },
      { name: "ail", quantity: "2 gousses" },
      { name: "gingembre", quantity: "1 c.à.c", optional: true },
    ],
    prepTime: 10, cookTime: 10, servings: 2, difficulty: 1,
    modes: ["rapide", "végétarien", "vegan", "anti-gaspillage", "sportif"],
    nutritionScore: 90, antiWasteScore: 93, imageKey: null,
  },
  {
    id: "r8_galettes",
    title: "Galettes de légumes",
    description: "Des galettes croustillantes faites avec vos légumes râpés du moment.",
    tags: ["legume"],
    ingredients: [
      { name: "courgette", quantity: "2" },
      { name: "carotte", quantity: "1", optional: true },
      { name: "oeufs", quantity: "2" },
      { name: "farine", quantity: "3 c.à.s" },
      { name: "fromage râpé", quantity: "50g", optional: true },
      { name: "herbes fraîches", quantity: "quelques tiges", optional: true },
    ],
    prepTime: 15, cookTime: 15, servings: 2, difficulty: 1,
    modes: ["végétarien", "anti-gaspillage", "rapide"],
    nutritionScore: 82, antiWasteScore: 94, imageKey: null,
  },
  {
    id: "r8_poiree",
    title: "Poêlée de légumes express",
    description: "Tous vos légumes sautés à la poêle avec ail et fines herbes.",
    tags: ["legume"],
    ingredients: [
      { name: "courgette", quantity: "1", optional: true },
      { name: "poivron", quantity: "1", optional: true },
      { name: "champignon", quantity: "150g", optional: true },
      { name: "tomate", quantity: "2", optional: true },
      { name: "ail", quantity: "2 gousses" },
      { name: "huile d'olive", quantity: "2 c.à.s" },
    ],
    prepTime: 5, cookTime: 15, servings: 2, difficulty: 1,
    modes: ["rapide", "végétarien", "vegan", "anti-gaspillage"],
    nutritionScore: 88, antiWasteScore: 97, imageKey: null,
  },
  {
    id: "r8_salade",
    title: "Grande salade composée",
    description: "Une salade fraîche et nourrissante avec tout ce que vous avez.",
    tags: ["legume"],
    ingredients: [
      { name: "salade verte", quantity: "1" },
      { name: "tomate", quantity: "2" },
      { name: "concombre", quantity: "1", optional: true },
      { name: "carotte", quantity: "1", optional: true },
      { name: "oeufs", quantity: "2", optional: true },
      { name: "thon", quantity: "1 boîte", optional: true },
      { name: "vinaigrette", quantity: "3 c.à.s" },
    ],
    prepTime: 10, cookTime: 0, servings: 2, difficulty: 1,
    modes: ["rapide", "végétarien", "anti-gaspillage", "sportif"],
    nutritionScore: 92, antiWasteScore: 88, imageKey: "salad",
  },

  // ── SOUPES & VELOUTÉS ──────────────────────────────────────────────────────
  {
    id: "r9_soupe_legumes",
    title: "Soupe de légumes maison",
    description: "Une soupe réconfortante qui transforme vos légumes un peu mûrs en délice.",
    tags: ["legume"],
    ingredients: [
      { name: "carotte", quantity: "3" },
      { name: "pomme de terre", quantity: "2" },
      { name: "poireau", quantity: "1", optional: true },
      { name: "oignon", quantity: "1" },
      { name: "bouillon de légumes", quantity: "1L" },
      { name: "crème fraîche", quantity: "2 c.à.s", optional: true },
    ],
    prepTime: 15, cookTime: 25, servings: 4, difficulty: 1,
    modes: ["végétarien", "économique", "anti-gaspillage", "famille"],
    nutritionScore: 88, antiWasteScore: 95, imageKey: null,
  },
  {
    id: "r9_veloute_carotte",
    title: "Velouté de carottes au gingembre",
    description: "Un velouté doux et parfumé, chaud en hiver, frais en été.",
    ingredients: [
      { name: "carotte", quantity: "500g" },
      { name: "oignon", quantity: "1" },
      { name: "gingembre", quantity: "1 c.à.c", optional: true },
      { name: "crème fraîche", quantity: "5cl", optional: true },
      { name: "bouillon", quantity: "600ml" },
    ],
    prepTime: 10, cookTime: 25, servings: 3, difficulty: 1,
    modes: ["végétarien", "anti-gaspillage", "économique", "sportif"],
    nutritionScore: 86, antiWasteScore: 93, imageKey: null,
  },
  {
    id: "r9_soupe_tomate",
    title: "Soupe de tomates rôties",
    description: "Tomates rôties au four puis mixées avec basilic et parmesan.",
    ingredients: [
      { name: "tomate", quantity: "800g" },
      { name: "ail", quantity: "4 gousses" },
      { name: "oignon", quantity: "1" },
      { name: "basilic", quantity: "1 bouquet", optional: true },
      { name: "huile d'olive", quantity: "3 c.à.s" },
    ],
    prepTime: 10, cookTime: 35, servings: 3, difficulty: 1,
    modes: ["végétarien", "vegan", "anti-gaspillage", "gourmet"],
    nutritionScore: 88, antiWasteScore: 94, imageKey: null,
  },
  {
    id: "r9_minestrone",
    title: "Minestrone de légumes",
    description: "La soupe italienne complète avec légumes, légumineuses et pâtes.",
    tags: ["legume"],
    ingredients: [
      { name: "tomate", quantity: "3" },
      { name: "courgette", quantity: "1" },
      { name: "carotte", quantity: "2" },
      { name: "oignon", quantity: "1" },
      { name: "pâtes", quantity: "80g", optional: true },
      { name: "haricot blanc", quantity: "200g", optional: true },
      { name: "bouillon", quantity: "1L" },
    ],
    prepTime: 15, cookTime: 30, servings: 4, difficulty: 1,
    modes: ["végétarien", "vegan", "famille", "anti-gaspillage"],
    nutritionScore: 90, antiWasteScore: 96, imageKey: null,
  },
  {
    id: "r9_soupe_lentilles",
    title: "Soupe de lentilles corail",
    description: "Soupe de lentilles corail aux épices, crémeuse et nourrissante.",
    ingredients: [
      { name: "lentille", quantity: "200g" },
      { name: "oignon", quantity: "1" },
      { name: "carotte", quantity: "2", optional: true },
      { name: "tomate", quantity: "2", optional: true },
      { name: "cumin", quantity: "1 c.à.c", optional: true },
      { name: "curcuma", quantity: "1 c.à.c", optional: true },
      { name: "bouillon", quantity: "800ml" },
    ],
    prepTime: 10, cookTime: 25, servings: 3, difficulty: 1,
    modes: ["végétarien", "vegan", "économique", "anti-gaspillage", "sportif"],
    nutritionScore: 92, antiWasteScore: 88, imageKey: null,
  },
  {
    id: "r9_veloute_poireau",
    title: "Velouté de poireaux",
    description: "Un velouté doux et soyeux, le classique réconfort de l'hiver.",
    ingredients: [
      { name: "poireau", quantity: "3" },
      { name: "pomme de terre", quantity: "2" },
      { name: "oignon", quantity: "1", optional: true },
      { name: "crème fraîche", quantity: "10cl", optional: true },
      { name: "bouillon", quantity: "700ml" },
      { name: "beurre", quantity: "20g" },
    ],
    prepTime: 15, cookTime: 25, servings: 3, difficulty: 1,
    modes: ["végétarien", "anti-gaspillage", "économique"],
    nutritionScore: 84, antiWasteScore: 92, imageKey: null,
  },

  // ── POMMES DE TERRE ────────────────────────────────────────────────────────
  {
    id: "r10_gratin",
    title: "Gratin dauphinois",
    description: "Un gratin crémeux et doré, le classique français réconfortant.",
    ingredients: [
      { name: "pomme de terre", quantity: "1kg" },
      { name: "crème fraîche", quantity: "40cl" },
      { name: "ail", quantity: "1 gousse" },
      { name: "gruyère râpé", quantity: "80g", optional: true },
      { name: "noix de muscade", quantity: "1 pincée", optional: true },
      { name: "beurre", quantity: "20g" },
    ],
    prepTime: 20, cookTime: 45, servings: 4, difficulty: 2,
    modes: ["végétarien", "famille", "économique", "gourmet"],
    nutritionScore: 65, antiWasteScore: 75, imageKey: null,
  },
  {
    id: "r10_pommes_sautees",
    title: "Pommes de terre sautées aillées",
    description: "Des pommes de terre dorées et croustillantes à l'ail et au persil.",
    ingredients: [
      { name: "pomme de terre", quantity: "500g" },
      { name: "ail", quantity: "2 gousses" },
      { name: "persil", quantity: "quelques tiges", optional: true },
      { name: "huile", quantity: "3 c.à.s" },
      { name: "sel et poivre", quantity: "au goût" },
    ],
    prepTime: 10, cookTime: 25, servings: 2, difficulty: 1,
    modes: ["végétarien", "vegan", "économique", "anti-gaspillage"],
    nutritionScore: 65, antiWasteScore: 85, imageKey: null,
  },
  {
    id: "r10_puree",
    title: "Purée de pommes de terre maison",
    description: "Une purée onctueuse et beurrée, le plaisir simple par excellence.",
    ingredients: [
      { name: "pomme de terre", quantity: "800g" },
      { name: "beurre", quantity: "60g" },
      { name: "lait", quantity: "15cl" },
      { name: "noix de muscade", quantity: "1 pincée", optional: true },
      { name: "sel et poivre", quantity: "au goût" },
    ],
    prepTime: 10, cookTime: 25, servings: 4, difficulty: 1,
    modes: ["végétarien", "famille", "économique"],
    nutritionScore: 68, antiWasteScore: 78, imageKey: null,
  },

  // ── LÉGUMINEUSES ───────────────────────────────────────────────────────────
  {
    id: "r11_chili",
    title: "Chili sin carne",
    description: "Un chili végétarien riche en saveurs avec pois chiches et haricots.",
    tags: ["legume"],
    ingredients: [
      { name: "pois chiche", quantity: "400g" },
      { name: "haricot rouge", quantity: "200g", optional: true },
      { name: "tomate", quantity: "400g" },
      { name: "oignon", quantity: "1" },
      { name: "poivron", quantity: "1", optional: true },
      { name: "cumin", quantity: "1 c.à.c" },
      { name: "paprika fumé", quantity: "1 c.à.c", optional: true },
    ],
    prepTime: 10, cookTime: 30, servings: 3, difficulty: 1,
    modes: ["végétarien", "vegan", "anti-gaspillage", "économique", "sportif"],
    nutritionScore: 90, antiWasteScore: 88, imageKey: null,
  },
  {
    id: "r11_curry_pois",
    title: "Curry de pois chiches épicé",
    description: "Un curry végétarien riche en protéines, parfumé et généreux.",
    ingredients: [
      { name: "pois chiche", quantity: "400g" },
      { name: "lait de coco", quantity: "200ml" },
      { name: "tomate", quantity: "3" },
      { name: "oignon", quantity: "1" },
      { name: "curry", quantity: "2 c.à.s" },
      { name: "ail", quantity: "2 gousses" },
      { name: "gingembre", quantity: "1 c.à.c", optional: true },
    ],
    prepTime: 10, cookTime: 25, servings: 3, difficulty: 1,
    modes: ["végétarien", "vegan", "anti-gaspillage", "sportif"],
    nutritionScore: 88, antiWasteScore: 82, imageKey: null,
  },

  // ── FROMAGE / PRODUITS LAITIERS ────────────────────────────────────────────
  {
    id: "r12_croque",
    title: "Croque-monsieur gratiné",
    description: "Le sandwich chaud incontournable, croustillant et fondant.",
    ingredients: [
      { name: "pain de mie", quantity: "4 tranches" },
      { name: "jambon", quantity: "2 tranches" },
      { name: "fromage râpé", quantity: "80g" },
      { name: "beurre", quantity: "20g" },
      { name: "crème fraîche", quantity: "2 c.à.s", optional: true },
    ],
    prepTime: 5, cookTime: 10, servings: 2, difficulty: 1,
    modes: ["rapide", "économique", "famille"],
    nutritionScore: 65, antiWasteScore: 72, imageKey: null,
  },
  {
    id: "r12_fondue",
    title: "Fondue au fromage express",
    description: "Une fondue rapide pour un soir de convivialité avec ce que vous avez.",
    ingredients: [
      { name: "fromage", quantity: "400g" },
      { name: "ail", quantity: "1 gousse" },
      { name: "vin blanc", quantity: "15cl", optional: true },
      { name: "pain", quantity: "1" },
      { name: "maïzena", quantity: "1 c.à.s", optional: true },
    ],
    prepTime: 10, cookTime: 15, servings: 3, difficulty: 2,
    modes: ["végétarien", "famille", "gourmet"],
    nutritionScore: 60, antiWasteScore: 82, imageKey: null,
  },
  {
    id: "r12_pizza_rapide",
    title: "Pizza express maison",
    description: "Pizza maison sans levure, prête en 30 minutes, avec vos garnitures.",
    tags: ["legume", "produit_laitier"],
    ingredients: [
      { name: "farine", quantity: "300g" },
      { name: "tomate", quantity: "3" },
      { name: "mozzarella", quantity: "150g" },
      { name: "jambon", quantity: "100g", optional: true },
      { name: "champignon", quantity: "100g", optional: true },
      { name: "huile d'olive", quantity: "2 c.à.s" },
    ],
    prepTime: 20, cookTime: 15, servings: 2, difficulty: 2,
    modes: ["famille", "anti-gaspillage"],
    nutritionScore: 68, antiWasteScore: 80, imageKey: null,
  },

  // ── PETIT-DÉJEUNER / FRUITS ────────────────────────────────────────────────
  {
    id: "r13_smoothie",
    title: "Smoothie bowl protéiné",
    description: "Un bol énergisant pour le matin avec vos fruits et yaourt.",
    tags: ["fruit"],
    ingredients: [
      { name: "banane", quantity: "2" },
      { name: "yaourt grec", quantity: "150g" },
      { name: "fruits rouges", quantity: "100g", optional: true },
      { name: "miel", quantity: "1 c.à.c", optional: true },
      { name: "graines de chia", quantity: "1 c.à.s", optional: true },
      { name: "granola", quantity: "30g", optional: true },
    ],
    prepTime: 5, cookTime: 0, servings: 1, difficulty: 1,
    modes: ["rapide", "végétarien", "sportif", "anti-gaspillage"],
    nutritionScore: 94, antiWasteScore: 85, imageKey: null,
  },
  {
    id: "r13_porridge",
    title: "Porridge aux fruits",
    description: "Un porridge chaud et réconfortant, base parfaite pour vos fruits.",
    tags: ["fruit"],
    ingredients: [
      { name: "flocons d'avoine", quantity: "80g" },
      { name: "lait", quantity: "200ml" },
      { name: "banane", quantity: "1", optional: true },
      { name: "pomme", quantity: "1", optional: true },
      { name: "miel", quantity: "1 c.à.s", optional: true },
      { name: "cannelle", quantity: "1 pincée", optional: true },
    ],
    prepTime: 5, cookTime: 5, servings: 1, difficulty: 1,
    modes: ["rapide", "végétarien", "sportif", "économique"],
    nutritionScore: 88, antiWasteScore: 80, imageKey: null,
  },
  {
    id: "r13_crepes",
    title: "Crêpes sucrées maison",
    description: "Des crêpes légères et dorées, parfaites pour le goûter ou le dessert.",
    ingredients: [
      { name: "farine", quantity: "250g" },
      { name: "oeufs", quantity: "3" },
      { name: "lait", quantity: "500ml" },
      { name: "beurre", quantity: "30g" },
      { name: "sucre", quantity: "1 c.à.s", optional: true },
    ],
    prepTime: 10, cookTime: 20, servings: 6, difficulty: 1,
    modes: ["végétarien", "famille", "économique"],
    nutritionScore: 65, antiWasteScore: 75, imageKey: null,
  },
  {
    id: "r13_pancakes",
    title: "Pancakes moelleux américains",
    description: "Des pancakes gonflés et moelleux, le petit-déjeuner des champions.",
    ingredients: [
      { name: "farine", quantity: "200g" },
      { name: "oeufs", quantity: "2" },
      { name: "lait", quantity: "250ml" },
      { name: "beurre", quantity: "30g" },
      { name: "levure chimique", quantity: "1 sachet" },
      { name: "sucre", quantity: "2 c.à.s", optional: true },
    ],
    prepTime: 10, cookTime: 15, servings: 4, difficulty: 1,
    modes: ["végétarien", "famille", "rapide"],
    nutritionScore: 68, antiWasteScore: 72, imageKey: null,
  },
  {
    id: "r13_compote",
    title: "Compote de pommes maison",
    description: "Une compote douce et sans sucre ajouté pour liquider vos pommes.",
    ingredients: [
      { name: "pomme", quantity: "6" },
      { name: "cannelle", quantity: "1 c.à.c", optional: true },
      { name: "vanille", quantity: "1 gousse", optional: true },
      { name: "jus de citron", quantity: "1 c.à.s", optional: true },
    ],
    prepTime: 10, cookTime: 20, servings: 4, difficulty: 1,
    modes: ["végétarien", "vegan", "anti-gaspillage", "famille", "économique"],
    nutritionScore: 82, antiWasteScore: 96, imageKey: null,
  },

  // ── RAPIDE / SANDWICH ──────────────────────────────────────────────────────
  {
    id: "r14_toast_avocat",
    title: "Toast avocat-oeuf",
    description: "Le brunch tendance : toast croustillant avec avocat et oeuf.",
    ingredients: [
      { name: "pain", quantity: "2 tranches" },
      { name: "avocat", quantity: "1" },
      { name: "oeufs", quantity: "2", optional: true },
      { name: "citron", quantity: "1/2", optional: true },
      { name: "sel et poivre", quantity: "au goût" },
    ],
    prepTime: 5, cookTime: 5, servings: 1, difficulty: 1,
    modes: ["rapide", "végétarien", "sportif"],
    nutritionScore: 88, antiWasteScore: 78, imageKey: null,
  },
  {
    id: "r14_sandwich",
    title: "Sandwich garni complet",
    description: "Un sandwich nourrissant avec ce que vous avez dans votre frigo.",
    tags: ["viande", "legume", "produit_laitier"],
    ingredients: [
      { name: "pain", quantity: "1 baguette" },
      { name: "jambon", quantity: "3 tranches", optional: true },
      { name: "fromage", quantity: "60g", optional: true },
      { name: "salade", quantity: "quelques feuilles", optional: true },
      { name: "tomate", quantity: "1", optional: true },
      { name: "moutarde", quantity: "1 c.à.c", optional: true },
    ],
    prepTime: 5, cookTime: 0, servings: 1, difficulty: 1,
    modes: ["rapide", "économique", "anti-gaspillage"],
    nutritionScore: 70, antiWasteScore: 88, imageKey: null,
  },
  {
    id: "r14_wrap",
    title: "Wrap poulet et légumes",
    description: "Un wrap rapide et équilibré, parfait pour le déjeuner.",
    tags: ["legume"],
    ingredients: [
      { name: "tortilla", quantity: "2" },
      { name: "poulet", quantity: "150g", optional: true },
      { name: "salade", quantity: "quelques feuilles", optional: true },
      { name: "tomate", quantity: "1", optional: true },
      { name: "avocat", quantity: "1", optional: true },
      { name: "fromage", quantity: "40g", optional: true },
    ],
    prepTime: 10, cookTime: 0, servings: 1, difficulty: 1,
    modes: ["rapide", "anti-gaspillage", "sportif"],
    nutritionScore: 82, antiWasteScore: 85, imageKey: null,
  },
  {
    id: "r14_bruschetta",
    title: "Bruschetta tomate-basilic",
    description: "Le classique italien : pain grillé frotté à l'ail, tomate et basilic.",
    ingredients: [
      { name: "pain", quantity: "4 tranches" },
      { name: "tomate", quantity: "3" },
      { name: "ail", quantity: "1 gousse" },
      { name: "basilic", quantity: "quelques feuilles", optional: true },
      { name: "huile d'olive", quantity: "3 c.à.s" },
    ],
    prepTime: 10, cookTime: 5, servings: 2, difficulty: 1,
    modes: ["rapide", "végétarien", "vegan", "anti-gaspillage"],
    nutritionScore: 72, antiWasteScore: 86, imageKey: null,
  },

  // ── TABOULÉ / CÉRÉALES ─────────────────────────────────────────────────────
  {
    id: "r15_taboule",
    title: "Taboulé maison",
    description: "Un taboulé frais et coloré, parfait pour les journées chaudes.",
    ingredients: [
      { name: "semoule", quantity: "200g" },
      { name: "tomate", quantity: "3" },
      { name: "concombre", quantity: "1" },
      { name: "menthe", quantity: "1 bouquet", optional: true },
      { name: "persil", quantity: "1 bouquet" },
      { name: "citron", quantity: "2" },
      { name: "huile d'olive", quantity: "3 c.à.s" },
    ],
    prepTime: 20, cookTime: 5, servings: 4, difficulty: 1,
    modes: ["végétarien", "vegan", "économique", "anti-gaspillage", "sportif"],
    nutritionScore: 86, antiWasteScore: 82, imageKey: null,
  },
  {
    id: "r15_couscous",
    title: "Couscous express aux légumes",
    description: "Un couscous rapide et parfumé avec vos légumes et épices.",
    tags: ["legume"],
    ingredients: [
      { name: "semoule", quantity: "200g" },
      { name: "courgette", quantity: "2", optional: true },
      { name: "carotte", quantity: "2", optional: true },
      { name: "pois chiche", quantity: "200g", optional: true },
      { name: "oignon", quantity: "1" },
      { name: "bouillon", quantity: "400ml" },
      { name: "ras el hanout", quantity: "1 c.à.s", optional: true },
    ],
    prepTime: 15, cookTime: 20, servings: 3, difficulty: 1,
    modes: ["végétarien", "vegan", "anti-gaspillage", "famille"],
    nutritionScore: 84, antiWasteScore: 90, imageKey: null,
  },

  // ── SPÉCIAL / FUSION ───────────────────────────────────────────────────────
  {
    id: "r16_tajine",
    title: "Tajine de légumes aux épices",
    description: "Un plat mijoté aux saveurs du Maghreb, parfumé à la cannelle et au cumin.",
    tags: ["legume"],
    ingredients: [
      { name: "poulet", quantity: "500g", optional: true },
      { name: "carotte", quantity: "3" },
      { name: "courgette", quantity: "2", optional: true },
      { name: "tomate", quantity: "3" },
      { name: "oignon", quantity: "2" },
      { name: "pois chiche", quantity: "200g", optional: true },
      { name: "cannelle", quantity: "1 c.à.c", optional: true },
      { name: "cumin", quantity: "1 c.à.c", optional: true },
    ],
    prepTime: 20, cookTime: 45, servings: 4, difficulty: 2,
    modes: ["anti-gaspillage", "famille", "gourmet"],
    nutritionScore: 88, antiWasteScore: 90, imageKey: null,
  },
  {
    id: "r16_boeuf_soja",
    title: "Wok de boeuf aux légumes",
    description: "Un wok express savoureux avec légumes croquants et boeuf tendre.",
    tags: ["legume"],
    ingredients: [
      { name: "boeuf", quantity: "300g" },
      { name: "poivron", quantity: "2" },
      { name: "carotte", quantity: "1" },
      { name: "courgette", quantity: "1", optional: true },
      { name: "sauce soja", quantity: "3 c.à.s" },
      { name: "ail", quantity: "2 gousses" },
      { name: "gingembre", quantity: "1 c.à.c", optional: true },
    ],
    prepTime: 15, cookTime: 15, servings: 2, difficulty: 2,
    modes: ["rapide", "sportif", "anti-gaspillage"],
    nutritionScore: 88, antiWasteScore: 85, imageKey: null,
  },
  {
    id: "r16_salade_fruits",
    title: "Salade de fruits du frigo",
    description: "Une salade de fruits fraîche et colorée avec vos fruits du moment.",
    tags: ["fruit"],
    ingredients: [
      { name: "pomme", quantity: "2", optional: true },
      { name: "banane", quantity: "1", optional: true },
      { name: "orange", quantity: "1", optional: true },
      { name: "fraise", quantity: "100g", optional: true },
      { name: "jus de citron", quantity: "1 c.à.s" },
      { name: "miel", quantity: "1 c.à.s", optional: true },
    ],
    prepTime: 10, cookTime: 0, servings: 3, difficulty: 1,
    modes: ["rapide", "végétarien", "vegan", "anti-gaspillage", "famille"],
    nutritionScore: 92, antiWasteScore: 95, imageKey: null,
  },
  {
    id: "r16_croque_salé",
    title: "Crêpes salées jambon-fromage",
    description: "Des crêpes moelleuses garnies de jambon, fromage et champignons.",
    ingredients: [
      { name: "farine", quantity: "250g" },
      { name: "oeufs", quantity: "2" },
      { name: "lait", quantity: "500ml" },
      { name: "jambon", quantity: "4 tranches", optional: true },
      { name: "fromage râpé", quantity: "100g" },
      { name: "champignon", quantity: "100g", optional: true },
      { name: "beurre", quantity: "30g" },
    ],
    prepTime: 15, cookTime: 20, servings: 4, difficulty: 1,
    modes: ["famille", "économique", "anti-gaspillage"],
    nutritionScore: 72, antiWasteScore: 80, imageKey: null,
  },
  {
    id: "r17_pasta_saumon",
    title: "Pâtes au saumon fumé et crème",
    description: "Pâtes crémeuses au saumon fumé, rapides et élégantes.",
    ingredients: [
      { name: "pâtes", quantity: "200g" },
      { name: "saumon fumé", quantity: "100g" },
      { name: "crème fraîche", quantity: "15cl" },
      { name: "citron", quantity: "1/2", optional: true },
      { name: "aneth", quantity: "quelques tiges", optional: true },
      { name: "câpres", quantity: "1 c.à.s", optional: true },
    ],
    prepTime: 5, cookTime: 15, servings: 2, difficulty: 1,
    modes: ["rapide", "gourmet"],
    nutritionScore: 82, antiWasteScore: 75, imageKey: null,
  },
  {
    id: "r17_chou_saute",
    title: "Chou sauté au lard et pommes de terre",
    description: "Un plat rustique et nourrissant anti-gaspillage par excellence.",
    ingredients: [
      { name: "chou", quantity: "1/2" },
      { name: "pomme de terre", quantity: "3" },
      { name: "lardons", quantity: "150g", optional: true },
      { name: "oignon", quantity: "1" },
      { name: "ail", quantity: "2 gousses", optional: true },
    ],
    prepTime: 15, cookTime: 25, servings: 3, difficulty: 1,
    modes: ["économique", "anti-gaspillage", "famille"],
    nutritionScore: 78, antiWasteScore: 95, imageKey: null,
  },
  {
    id: "r17_gratin_coquillette",
    title: "Gratin de coquillettes au fromage",
    description: "Le mac & cheese à la française, fondant et gratinné.",
    ingredients: [
      { name: "pâtes", quantity: "250g" },
      { name: "fromage râpé", quantity: "120g" },
      { name: "crème fraîche", quantity: "15cl" },
      { name: "beurre", quantity: "20g" },
      { name: "noix de muscade", quantity: "1 pincée", optional: true },
    ],
    prepTime: 10, cookTime: 25, servings: 3, difficulty: 1,
    modes: ["végétarien", "famille", "économique"],
    nutritionScore: 60, antiWasteScore: 75, imageKey: null,
  },
  {
    id: "r17_epinards_oeufs",
    title: "Épinards à la crème et oeufs pochés",
    description: "Des épinards crémeux avec des oeufs pochés — élégant et rapide.",
    ingredients: [
      { name: "épinard", quantity: "300g" },
      { name: "oeufs", quantity: "4" },
      { name: "crème fraîche", quantity: "10cl" },
      { name: "ail", quantity: "1 gousse" },
      { name: "noix de muscade", quantity: "1 pincée", optional: true },
    ],
    prepTime: 10, cookTime: 15, servings: 2, difficulty: 2,
    modes: ["végétarien", "rapide", "sportif", "anti-gaspillage"],
    nutritionScore: 90, antiWasteScore: 92, imageKey: null,
  },
  {
    id: "r18_gateau_yaourt",
    title: "Gâteau au yaourt",
    description: "Le gâteau d'enfance par excellence, moelleux et simple comme bonjour.",
    ingredients: [
      { name: "yaourt", quantity: "1 pot" },
      { name: "farine", quantity: "2 pots" },
      { name: "oeufs", quantity: "3" },
      { name: "sucre", quantity: "1 pot" },
      { name: "huile", quantity: "1/2 pot" },
      { name: "levure chimique", quantity: "1 sachet" },
    ],
    prepTime: 10, cookTime: 30, servings: 8, difficulty: 1,
    modes: ["végétarien", "famille", "économique"],
    nutritionScore: 60, antiWasteScore: 80, imageKey: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Categories & modes
// ─────────────────────────────────────────────────────────────────────────────

export const INGREDIENT_CATEGORIES = [
  { key: "légumes", label: "Légumes", icon: "leaf" },
  { key: "fruits", label: "Fruits", icon: "circle" },
  { key: "viandes", label: "Viandes", icon: "target" },
  { key: "poissons", label: "Poissons", icon: "droplet" },
  { key: "laitages", label: "Laitages", icon: "package" },
  { key: "féculents", label: "Féculents", icon: "grid" },
  { key: "épices", label: "Épices & condiments", icon: "zap" },
  { key: "autres", label: "Autres", icon: "more-horizontal" },
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]["key"];

export const RECIPE_MODES: { key: RecipeMode; label: string; icon: string }[] = [
  { key: "anti-gaspillage", label: "Anti-gaspillage", icon: "refresh-cw" },
  { key: "rapide", label: "< 20 min", icon: "clock" },
  { key: "végétarien", label: "Végétarien", icon: "leaf" },
  { key: "vegan", label: "Vegan", icon: "sun" },
  { key: "sportif", label: "Sportif", icon: "activity" },
  { key: "famille", label: "Famille", icon: "users" },
  { key: "gourmet", label: "Gourmet", icon: "star" },
  { key: "économique", label: "Économique", icon: "trending-down" },
];
