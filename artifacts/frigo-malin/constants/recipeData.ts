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
}

export const RECIPES: Recipe[] = [
  {
    id: "r1",
    title: "Omelette aux légumes",
    description: "Une omelette savoureuse et rapide avec vos légumes du frigo.",
    ingredients: [
      { name: "oeufs", quantity: "3" },
      { name: "poivron", quantity: "1", optional: true },
      { name: "tomate", quantity: "1", optional: true },
      { name: "oignon", quantity: "1" },
      { name: "fromage râpé", quantity: "30g", optional: true },
      { name: "huile d'olive", quantity: "1 c.à.s" },
    ],
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    difficulty: 1,
    modes: ["rapide", "végétarien", "anti-gaspillage", "famille"],
    nutritionScore: 85,
    antiWasteScore: 90,
    imageKey: null,
  },
  {
    id: "r2",
    title: "Pâtes à la sauce tomate fraîche",
    description: "Des pâtes al dente avec une sauce tomate maison parfumée au basilic.",
    ingredients: [
      { name: "pâtes", quantity: "200g" },
      { name: "tomate", quantity: "4" },
      { name: "ail", quantity: "2 gousses" },
      { name: "basilic", quantity: "quelques feuilles", optional: true },
      { name: "huile d'olive", quantity: "2 c.à.s" },
      { name: "parmesan", quantity: "30g", optional: true },
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    difficulty: 1,
    modes: ["végétarien", "économique", "famille", "anti-gaspillage"],
    nutritionScore: 70,
    antiWasteScore: 85,
    imageKey: "pasta",
  },
  {
    id: "r3",
    title: "Salade composée fraîcheur",
    description: "Une salade colorée et nourrissante qui utilise vos légumes frais.",
    ingredients: [
      { name: "salade verte", quantity: "1" },
      { name: "tomate", quantity: "2" },
      { name: "concombre", quantity: "1", optional: true },
      { name: "carotte", quantity: "1", optional: true },
      { name: "oeufs", quantity: "2", optional: true },
      { name: "thon", quantity: "1 boîte", optional: true },
      { name: "vinaigrette", quantity: "3 c.à.s" },
    ],
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 1,
    modes: ["rapide", "végétarien", "anti-gaspillage", "sportif"],
    nutritionScore: 92,
    antiWasteScore: 88,
    imageKey: "salad",
  },
  {
    id: "r4",
    title: "Soupe de légumes maison",
    description: "Une soupe réconfortante qui transforme vos légumes un peu mûrs en délice.",
    ingredients: [
      { name: "carotte", quantity: "3" },
      { name: "pomme de terre", quantity: "2" },
      { name: "poireau", quantity: "1", optional: true },
      { name: "oignon", quantity: "1" },
      { name: "bouillon de légumes", quantity: "1L" },
      { name: "crème fraîche", quantity: "2 c.à.s", optional: true },
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 1,
    modes: ["végétarien", "économique", "anti-gaspillage", "famille"],
    nutritionScore: 88,
    antiWasteScore: 95,
    imageKey: null,
  },
  {
    id: "r5",
    title: "Poêlée de légumes au riz",
    description: "Riz sauté aux légumes de saison, sauce soja et sésame.",
    ingredients: [
      { name: "riz", quantity: "200g" },
      { name: "carotte", quantity: "2", optional: true },
      { name: "poivron", quantity: "1", optional: true },
      { name: "courgette", quantity: "1", optional: true },
      { name: "oeufs", quantity: "2", optional: true },
      { name: "sauce soja", quantity: "2 c.à.s" },
      { name: "ail", quantity: "2 gousses" },
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    difficulty: 2,
    modes: ["végétarien", "vegan", "anti-gaspillage", "économique"],
    nutritionScore: 80,
    antiWasteScore: 92,
    imageKey: null,
  },
  {
    id: "r6",
    title: "Poulet rôti aux herbes",
    description: "Un poulet tendre et parfumé aux herbes, pommes de terre et ail.",
    ingredients: [
      { name: "poulet", quantity: "1" },
      { name: "pomme de terre", quantity: "4" },
      { name: "ail", quantity: "4 gousses" },
      { name: "romarin", quantity: "2 branches", optional: true },
      { name: "thym", quantity: "2 branches", optional: true },
      { name: "huile d'olive", quantity: "3 c.à.s" },
      { name: "citron", quantity: "1", optional: true },
    ],
    prepTime: 15,
    cookTime: 60,
    servings: 4,
    difficulty: 2,
    modes: ["famille", "gourmet", "sportif"],
    nutritionScore: 90,
    antiWasteScore: 70,
    imageKey: null,
  },
  {
    id: "r7",
    title: "Curry de légumes",
    description: "Un curry parfumé et crémeux avec du lait de coco et vos légumes.",
    ingredients: [
      { name: "carotte", quantity: "2" },
      { name: "pomme de terre", quantity: "2" },
      { name: "oignon", quantity: "1" },
      { name: "lait de coco", quantity: "400ml" },
      { name: "pâte de curry", quantity: "2 c.à.s" },
      { name: "ail", quantity: "2 gousses" },
      { name: "riz", quantity: "200g" },
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 3,
    difficulty: 2,
    modes: ["végétarien", "vegan", "anti-gaspillage", "gourmet"],
    nutritionScore: 82,
    antiWasteScore: 88,
    imageKey: null,
  },
  {
    id: "r8",
    title: "Quiche aux légumes",
    description: "Une quiche maison croustillante garnie de légumes variés et de fromage.",
    ingredients: [
      { name: "pâte brisée", quantity: "1" },
      { name: "oeufs", quantity: "3" },
      { name: "crème fraîche", quantity: "20cl" },
      { name: "courgette", quantity: "1", optional: true },
      { name: "champignon", quantity: "200g", optional: true },
      { name: "fromage râpé", quantity: "100g" },
      { name: "lardons", quantity: "100g", optional: true },
    ],
    prepTime: 20,
    cookTime: 35,
    servings: 4,
    difficulty: 2,
    modes: ["famille", "gourmet", "anti-gaspillage"],
    nutritionScore: 75,
    antiWasteScore: 80,
    imageKey: null,
  },
  {
    id: "r9",
    title: "Smoothie bowl protéiné",
    description: "Un bol énergisant pour le matin avec vos fruits et yaourt.",
    ingredients: [
      { name: "banane", quantity: "2" },
      { name: "yaourt grec", quantity: "150g" },
      { name: "fruits rouges", quantity: "100g", optional: true },
      { name: "miel", quantity: "1 c.à.c", optional: true },
      { name: "graines de chia", quantity: "1 c.à.s", optional: true },
      { name: "granola", quantity: "30g", optional: true },
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 1,
    modes: ["rapide", "végétarien", "sportif", "anti-gaspillage"],
    nutritionScore: 94,
    antiWasteScore: 85,
    imageKey: null,
  },
  {
    id: "r10",
    title: "Frittata aux pommes de terre",
    description: "Une frittata rustique à l'italienne avec pommes de terre et herbes fraîches.",
    ingredients: [
      { name: "pomme de terre", quantity: "3" },
      { name: "oeufs", quantity: "5" },
      { name: "oignon", quantity: "1" },
      { name: "fromage râpé", quantity: "50g", optional: true },
      { name: "persil", quantity: "quelques tiges", optional: true },
      { name: "huile d'olive", quantity: "2 c.à.s" },
    ],
    prepTime: 10,
    cookTime: 25,
    servings: 3,
    difficulty: 2,
    modes: ["végétarien", "économique", "anti-gaspillage", "famille"],
    nutritionScore: 78,
    antiWasteScore: 90,
    imageKey: null,
  },
  {
    id: "r11",
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
    prepTime: 20,
    cookTime: 5,
    servings: 4,
    difficulty: 1,
    modes: ["végétarien", "vegan", "économique", "anti-gaspillage", "sportif"],
    nutritionScore: 86,
    antiWasteScore: 82,
    imageKey: null,
  },
  {
    id: "r12",
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
    prepTime: 20,
    cookTime: 45,
    servings: 4,
    difficulty: 2,
    modes: ["végétarien", "famille", "économique", "gourmet"],
    nutritionScore: 65,
    antiWasteScore: 75,
    imageKey: null,
  },
  {
    id: "r13",
    title: "Wok de boeuf aux légumes",
    description: "Un wok express savoureux avec des légumes croquants et du boeuf tendre.",
    ingredients: [
      { name: "boeuf", quantity: "300g" },
      { name: "poivron", quantity: "2" },
      { name: "carotte", quantity: "1" },
      { name: "courgette", quantity: "1", optional: true },
      { name: "sauce soja", quantity: "3 c.à.s" },
      { name: "ail", quantity: "2 gousses" },
      { name: "gingembre", quantity: "1 c.à.c", optional: true },
    ],
    prepTime: 15,
    cookTime: 15,
    servings: 2,
    difficulty: 2,
    modes: ["rapide", "sportif", "anti-gaspillage"],
    nutritionScore: 88,
    antiWasteScore: 85,
    imageKey: null,
  },
  {
    id: "r14",
    title: "Crêpes salées au jambon-fromage",
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
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 1,
    modes: ["famille", "économique", "anti-gaspillage"],
    nutritionScore: 72,
    antiWasteScore: 80,
    imageKey: null,
  },
  {
    id: "r15",
    title: "Ratatouille provençale",
    description: "Le grand classique provençal qui valorise vos légumes d'été.",
    ingredients: [
      { name: "courgette", quantity: "2" },
      { name: "aubergine", quantity: "1" },
      { name: "poivron", quantity: "2" },
      { name: "tomate", quantity: "4" },
      { name: "oignon", quantity: "1" },
      { name: "ail", quantity: "3 gousses" },
      { name: "herbes de Provence", quantity: "1 c.à.s" },
    ],
    prepTime: 20,
    cookTime: 45,
    servings: 4,
    difficulty: 2,
    modes: ["végétarien", "vegan", "anti-gaspillage", "gourmet", "famille"],
    nutritionScore: 91,
    antiWasteScore: 96,
    imageKey: null,
  },
];

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

export function scoreRecipe(recipe: Recipe, fridgeIngredients: string[]): number {
  const normalized = fridgeIngredients.map((i) => i.toLowerCase().trim());
  const required = recipe.ingredients.filter((i) => !i.optional);
  const optional = recipe.ingredients.filter((i) => i.optional);

  let score = 0;
  let requiredMatched = 0;

  for (const ing of required) {
    const match = normalized.some(
      (fridgeIng) =>
        fridgeIng.includes(ing.name.toLowerCase()) ||
        ing.name.toLowerCase().includes(fridgeIng)
    );
    if (match) {
      requiredMatched++;
      score += 10;
    } else {
      score -= 5;
    }
  }

  for (const ing of optional) {
    const match = normalized.some(
      (fridgeIng) =>
        fridgeIng.includes(ing.name.toLowerCase()) ||
        ing.name.toLowerCase().includes(fridgeIng)
    );
    if (match) score += 5;
  }

  if (required.length > 0 && requiredMatched < Math.ceil(required.length * 0.5)) {
    return -1;
  }

  return score;
}
