import type { Ingredient } from "@/contexts/FrigoContext";

export interface ComposedRecipe {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 1 | 2 | 3;
  modes: string[];
  ingredients: { name: string; quantity: string; optional?: boolean }[];
  steps: string[];
  tips: string;
  nutritionScore: number;
  antiWasteScore: number;
  usedCount: number;
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Ingredient classification
// ---------------------------------------------------------------------------

const PROTEINS = ["poulet", "boeuf", "porc", "jambon", "saucisse", "lardons", "thon", "saumon", "sardine", "crevette", "oeufs", "oeuf", "tofu", "pois chiche", "lentille", "haricot"];
const VEGGIES = ["tomate", "courgette", "carotte", "poivron", "aubergine", "champignon", "épinard", "brocoli", "chou", "poireau", "oignon", "ail", "poireau", "salade", "concombre", "céleri", "betterave", "artichaut", "asperge", "navet", "radis", "fenouil", "haricot vert", "petit pois", "maïs", "avocat"];
const STARCHES = ["pâtes", "riz", "pomme de terre", "semoule", "farine", "pain", "quinoa", "lentille", "boulgour", "polenta", "nouilles", "maïzena"];
const DAIRY = ["fromage", "lait", "crème", "beurre", "yaourt", "parmesan", "gruyère", "emmental", "mozzarella", "ricotta", "feta", "camembert", "chèvre"];
const FRUITS = ["pomme", "poire", "banane", "orange", "citron", "fraise", "framboise", "myrtille", "mangue", "ananas", "kiwi", "raisin", "pêche", "abricot", "cerise", "prune", "melon", "pastèque"];
const HERBS = ["persil", "coriandre", "basilic", "thym", "romarin", "menthe", "estragon", "ciboulette", "laurier", "herbes de Provence", "origan"];
const CONDIMENTS = ["huile", "vinaigre", "sauce soja", "moutarde", "ketchup", "mayonnaise", "concentré de tomate", "bouillon", "curry", "paprika", "cumin", "cannelle", "muscade"];

function classify(name: string): "protein" | "veggie" | "starch" | "dairy" | "fruit" | "herb" | "condiment" | "other" {
  const n = name.toLowerCase();
  if (PROTEINS.some(p => n.includes(p) || p.includes(n))) return "protein";
  if (VEGGIES.some(p => n.includes(p) || p.includes(n))) return "veggie";
  if (STARCHES.some(p => n.includes(p) || p.includes(n))) return "starch";
  if (DAIRY.some(p => n.includes(p) || p.includes(n))) return "dairy";
  if (FRUITS.some(p => n.includes(p) || p.includes(n))) return "fruit";
  if (HERBS.some(p => n.includes(p) || p.includes(n))) return "herb";
  if (CONDIMENTS.some(p => n.includes(p) || p.includes(n))) return "condiment";
  return "other";
}

function isEgg(name: string) { return name.toLowerCase().includes("oeuf"); }
function isChicken(name: string) { return name.toLowerCase().includes("poulet"); }
function isFish(name: string) { const n = name.toLowerCase(); return ["thon", "saumon", "sardine", "crevette", "poisson"].some(f => n.includes(f)); }
function isBeef(name: string) { const n = name.toLowerCase(); return ["boeuf", "steak", "viande"].some(f => n.includes(f)); }
function isPasta(name: string) { const n = name.toLowerCase(); return ["pâte", "spaghetti", "tagliatelle", "penne", "fusilli", "macaroni", "nouille"].some(f => n.includes(f)); }
function isRice(name: string) { return name.toLowerCase().includes("riz"); }
function isOnion(name: string) { return name.toLowerCase().includes("oignon"); }
function isGarlic(name: string) { return name.toLowerCase().includes("ail"); }
function isTomato(name: string) { return name.toLowerCase().includes("tomate"); }
function isPotato(name: string) { return name.toLowerCase().includes("pomme de terre"); }
function isZucchini(name: string) { return name.toLowerCase().includes("courgette"); }
function isCarrot(name: string) { return name.toLowerCase().includes("carotte"); }
function isCream(name: string) { const n = name.toLowerCase(); return ["crème", "cream"].some(f => n.includes(f)); }
function isCheese(name: string) { const n = name.toLowerCase(); return ["fromage", "parmesan", "gruyère", "emmental", "mozzarella", "feta"].some(f => n.includes(f)); }
function isMushroom(name: string) { return name.toLowerCase().includes("champignon"); }
function isBanana(name: string) { return name.toLowerCase().includes("banane"); }
function isLemon(name: string) { return name.toLowerCase().includes("citron"); }

// ---------------------------------------------------------------------------
// Quantity helpers
// ---------------------------------------------------------------------------
function qty(ing: Ingredient): string {
  return ing.quantity ? `${ing.quantity} ${ing.unit}`.trim() : ing.unit || "au goût";
}

// ---------------------------------------------------------------------------
// Template-based recipe composer
// ---------------------------------------------------------------------------

interface RecipeTemplate {
  id: string;
  name: (ings: Ingredient[]) => string;
  description: (ings: Ingredient[]) => string;
  match: (classified: Record<string, Ingredient[]>) => boolean;
  priority: (classified: Record<string, Ingredient[]>) => number;
  compose: (ings: Ingredient[], classified: Record<string, Ingredient[]>) => Partial<ComposedRecipe>;
}

const TEMPLATES: RecipeTemplate[] = [
  // ── Omelette / Frittata ─────────────────────────────────────────────────
  {
    id: "omelette",
    name: (ings) => {
      const extras = ings.filter(i => !isEgg(i.name)).slice(0, 2).map(i => i.name).join(" et ");
      return extras ? `Omelette aux ${extras}` : "Omelette moelleuse";
    },
    description: () => "Une omelette savoureuse et rapide, parfaite pour vider le frigo avec style.",
    match: (c) => (c.protein ?? []).some(i => isEgg(i.name)),
    priority: (c) => (c.protein ?? []).some(i => isEgg(i.name)) ? 10 : 0,
    compose: (ings, c) => {
      const eggs = (c.protein ?? []).filter(i => isEgg(i.name));
      const veggies = (c.veggie ?? []).slice(0, 3);
      const dairy = (c.dairy ?? []).slice(0, 1);
      const used = [...eggs, ...veggies, ...dairy];
      const steps: string[] = [
        `Cassez ${eggs.length > 0 ? qty(eggs[0]) : "3 oeufs"} dans un bol. Battez-les vigoureusement avec une pincée de sel et de poivre.`,
      ];
      if (veggies.length > 0) steps.push(`Coupez ${veggies.map(v => v.name).join(", ")} en petits morceaux. Faites revenir 3 minutes dans une poêle huilée.`);
      steps.push("Versez les œufs battus sur les légumes. Laissez coaguler 2 minutes à feu moyen.");
      if (dairy.some(d => isCheese(d.name))) steps.push(`Ajoutez ${dairy[0].name} râpé sur la moitié de l'omelette.`);
      steps.push("Pliez l'omelette en deux et glissez-la dans l'assiette. Servez immédiatement !");
      return {
        prepTime: 5, cookTime: 10, servings: 2, difficulty: 1,
        modes: ["rapide", "anti-gaspillage", "végétarien"],
        ingredients: [
          { name: eggs[0]?.name ?? "oeufs", quantity: eggs[0] ? qty(eggs[0]) : "3" },
          ...veggies.map(v => ({ name: v.name, quantity: qty(v), optional: true })),
          ...dairy.map(d => ({ name: d.name, quantity: qty(d), optional: true })),
          { name: "huile d'olive", quantity: "1 c.à.s" },
          { name: "sel et poivre", quantity: "au goût" },
        ],
        steps,
        tips: "Ajoutez une touche de crème fraîche dans les œufs pour une omelette ultra-moelleuse.",
        nutritionScore: 82,
        antiWasteScore: 90,
        usedCount: used.length,
        totalCount: ings.length,
      };
    },
  },

  // ── Pasta ────────────────────────────────────────────────────────────────
  {
    id: "pasta",
    name: (ings) => {
      const sauce = ings.find(i => isTomato(i.name)) ? "sauce tomate" : ings.find(i => isCream(i.name)) ? "crème" : "legumes";
      return `Pâtes à la ${sauce} maison`;
    },
    description: () => "Des pâtes savoureuses préparées avec ce que vous avez sous la main.",
    match: (c) => (c.starch ?? []).some(i => isPasta(i.name)),
    priority: (c) => (c.starch ?? []).some(i => isPasta(i.name)) ? 9 : 0,
    compose: (ings, c) => {
      const pasta = (c.starch ?? []).find(i => isPasta(i.name))!;
      const tomatoes = (c.veggie ?? []).filter(i => isTomato(i.name));
      const cream = (c.dairy ?? []).filter(i => isCream(i.name));
      const protein = (c.protein ?? []).filter(i => !isEgg(i.name)).slice(0, 1);
      const veggies = (c.veggie ?? []).filter(i => !isTomato(i.name)).slice(0, 2);
      const cheese = (c.dairy ?? []).filter(i => isCheese(i.name)).slice(0, 1);
      const hasSauce = tomatoes.length > 0 || cream.length > 0;
      const steps: string[] = [
        `Faites cuire ${qty(pasta)} de ${pasta.name} dans une grande casserole d'eau bouillante salée selon le temps indiqué sur le paquet.`,
      ];
      if (protein.length > 0) steps.push(`Faites revenir ${protein[0].name} en morceaux dans une poêle avec un filet d'huile jusqu'à coloration.`);
      if (veggies.length > 0) steps.push(`Ajoutez ${veggies.map(v => v.name).join(" et ")} coupés. Faites revenir 5 minutes.`);
      if (tomatoes.length > 0) steps.push(`Ajoutez les tomates concassées. Laissez mijoter 10 minutes à feu moyen. Assaisonnez.`);
      else if (cream.length > 0) steps.push(`Versez la crème. Laissez réduire 3 minutes.`);
      else steps.push("Ajoutez une louche d'eau de cuisson, un filet d'huile d'olive, sel et poivre.");
      steps.push(`Égouttez les pâtes et mélangez-les à la sauce. ${cheese.length > 0 ? `Ajoutez du ${cheese[0].name} râpé.` : ""} Servez chaud.`);
      return {
        prepTime: 10, cookTime: 20, servings: 2, difficulty: 1,
        modes: ["économique", "anti-gaspillage", ...(protein.length === 0 ? ["végétarien"] : [])],
        ingredients: [
          { name: pasta.name, quantity: qty(pasta) },
          ...tomatoes.map(t => ({ name: t.name, quantity: qty(t) })),
          ...cream.map(c => ({ name: c.name, quantity: qty(c), optional: true })),
          ...protein.map(p => ({ name: p.name, quantity: qty(p), optional: true })),
          ...veggies.map(v => ({ name: v.name, quantity: qty(v), optional: true })),
          ...cheese.map(ch => ({ name: ch.name, quantity: qty(ch), optional: true })),
          { name: "huile d'olive", quantity: "2 c.à.s" },
          { name: "sel et poivre", quantity: "au goût" },
        ],
        steps,
        tips: hasSauce ? "Gardez une louche d'eau de cuisson pour ajuster la consistance de la sauce." : "Un peu de jus de citron en finition donnera de la fraîcheur.",
        nutritionScore: 72,
        antiWasteScore: 88,
        usedCount: [pasta, ...tomatoes, ...cream, ...protein, ...veggies, ...cheese].length,
        totalCount: ings.length,
      };
    },
  },

  // ── Riz sauté ────────────────────────────────────────────────────────────
  {
    id: "fried-rice",
    name: () => "Riz sauté aux légumes du frigo",
    description: () => "Un riz sauté express qui utilise tous vos restes de légumes.",
    match: (c) => (c.starch ?? []).some(i => isRice(i.name)),
    priority: (c) => (c.starch ?? []).some(i => isRice(i.name)) ? 8 : 0,
    compose: (ings, c) => {
      const rice = (c.starch ?? []).find(i => isRice(i.name))!;
      const veggies = (c.veggie ?? []).slice(0, 4);
      const protein = (c.protein ?? []).slice(0, 1);
      const eggs = (c.protein ?? []).filter(i => isEgg(i.name)).slice(0, 1);
      const steps: string[] = [
        `Faites cuire ${qty(rice)} de riz dans 2x son volume d'eau salée (ou utilisez du riz cuit de la veille).`,
        `Pendant ce temps, coupez ${veggies.map(v => v.name).join(", ")} en petits dés.`,
        "Faites chauffer une poêle à feu vif avec un filet d'huile.",
      ];
      if (protein.length > 0 && !isEgg(protein[0].name)) steps.push(`Faites sauter ${protein[0].name} coupé en dés 3-4 min. Réservez.`);
      steps.push(`Faites sauter les légumes à feu vif 5 minutes en remuant souvent.`);
      if (eggs.length > 0) steps.push(`Poussez les légumes sur le côté, cassez les œufs et brouilllez-les dans la poêle.`);
      steps.push(`Ajoutez le riz, mélangez bien. Assaisonnez avec sauce soja, sel, poivre. Servez chaud.`);
      return {
        prepTime: 10, cookTime: 20, servings: 2, difficulty: 1,
        modes: ["rapide", "anti-gaspillage", "économique", ...(protein.filter(p => !isEgg(p.name)).length === 0 ? ["végétarien"] : [])],
        ingredients: [
          { name: rice.name, quantity: qty(rice) },
          ...veggies.map(v => ({ name: v.name, quantity: qty(v) })),
          ...protein.map(p => ({ name: p.name, quantity: qty(p), optional: true })),
          { name: "sauce soja", quantity: "2 c.à.s" },
          { name: "huile", quantity: "2 c.à.s" },
          { name: "sel et poivre", quantity: "au goût" },
        ],
        steps,
        tips: "Le riz de la veille est idéal pour un riz sauté : il est moins collant et absorbe mieux les saveurs.",
        nutritionScore: 78,
        antiWasteScore: 93,
        usedCount: [rice, ...veggies, ...protein].length,
        totalCount: ings.length,
      };
    },
  },

  // ── Soupe / Velouté ───────────────────────────────────────────────────────
  {
    id: "soup",
    name: (ings) => {
      const main = ings.filter(i => classify(i.name) === "veggie").slice(0, 2).map(i => i.name).join(" et ");
      return main ? `Velouté de ${main}` : "Soupe de légumes maison";
    },
    description: () => "Un velouté chaud et réconfortant qui transforme vos légumes en délice.",
    match: (c) => (c.veggie ?? []).length >= 2,
    priority: (c) => {
      const vegs = c.veggie ?? [];
      return vegs.length >= 3 ? 7 : vegs.length >= 2 ? 5 : 0;
    },
    compose: (ings, c) => {
      const veggies = (c.veggie ?? []).slice(0, 5);
      const cream = (c.dairy ?? []).filter(i => isCream(i.name)).slice(0, 1);
      const potato = (c.veggie ?? []).find(i => isPotato(i.name));
      const steps: string[] = [
        "Épluchez et coupez tous les légumes en morceaux grossiers.",
        `Faites revenir l'oignon et l'ail (si disponibles) dans une cocotte avec un filet d'huile.`,
        `Ajoutez ${veggies.map(v => v.name).join(", ")}. Couvrez d'eau ou de bouillon à hauteur.`,
        `${potato ? "Portez à ébullition puis" : "Portez à ébullition puis"} laissez cuire 20-25 minutes à feu moyen jusqu'à ce que les légumes soient tendres.`,
        "Mixez finement avec un mixeur plongeant.",
        `${cream.length > 0 ? `Ajoutez ${qty(cream[0])} de crème, mélangez. ` : ""}Rectifiez l'assaisonnement et servez avec du pain.`,
      ];
      return {
        prepTime: 15, cookTime: 25, servings: 3, difficulty: 1,
        modes: ["végétarien", "anti-gaspillage", "économique", "famille"],
        ingredients: [
          ...veggies.map(v => ({ name: v.name, quantity: qty(v) })),
          ...cream.map(cr => ({ name: cr.name, quantity: qty(cr), optional: true })),
          { name: "bouillon de légumes", quantity: "800ml" },
          { name: "huile d'olive", quantity: "1 c.à.s" },
          { name: "sel et poivre", quantity: "au goût" },
        ],
        steps,
        tips: "Ajoutez une cuillère de crème ou une noisette de beurre en finition pour un velouté plus soyeux.",
        nutritionScore: 88,
        antiWasteScore: 95,
        usedCount: [...veggies, ...cream].length,
        totalCount: ings.length,
      };
    },
  },

  // ── Poêlée de légumes ─────────────────────────────────────────────────────
  {
    id: "poelée",
    name: (ings) => {
      const main = ings.filter(i => classify(i.name) === "veggie").slice(0, 2).map(i => i.name).join(" et ");
      return `Poêlée de ${main || "légumes"}`;
    },
    description: () => "Une poêlée de légumes colorée et savoureuse, prête en 15 minutes.",
    match: (c) => (c.veggie ?? []).length >= 1,
    priority: (c) => (c.veggie ?? []).length >= 1 ? 4 : 0,
    compose: (ings, c) => {
      const veggies = (c.veggie ?? []).slice(0, 5);
      const protein = (c.protein ?? []).slice(0, 1);
      const herbs = (c.herb ?? []).slice(0, 1);
      const steps: string[] = [
        `Lavez et coupez ${veggies.map(v => v.name).join(", ")} en morceaux réguliers.`,
        "Faites chauffer une grande poêle ou wok à feu vif avec un filet d'huile.",
      ];
      if (protein.length > 0) steps.push(`Faites dorer ${protein[0].name} 4-5 min. Réservez.`);
      steps.push("Ajoutez les légumes les plus durs en premier (carottes, pommes de terre). Faites sauter 5 min.");
      steps.push("Ajoutez les légumes plus tendres (courgettes, poivrons). Continuez 5 min en remuant.");
      if (protein.length > 0) steps.push("Remettez la viande, mélangez et réchauffez 1 minute.");
      steps.push(`Assaisonnez de sel, poivre${herbs.length > 0 ? `, ${herbs[0].name}` : ""}. Servez aussitôt.`);
      return {
        prepTime: 10, cookTime: 15, servings: 2, difficulty: 1,
        modes: ["rapide", "anti-gaspillage", ...(protein.length === 0 ? ["végétarien", "vegan"] : [])],
        ingredients: [
          ...veggies.map(v => ({ name: v.name, quantity: qty(v) })),
          ...protein.map(p => ({ name: p.name, quantity: qty(p), optional: true })),
          ...herbs.map(h => ({ name: h.name, quantity: qty(h), optional: true })),
          { name: "huile d'olive", quantity: "2 c.à.s" },
          { name: "sel et poivre", quantity: "au goût" },
        ],
        steps,
        tips: "Commencez toujours par les légumes qui cuisent le plus longtemps pour une cuisson homogène.",
        nutritionScore: 85,
        antiWasteScore: 92,
        usedCount: [...veggies, ...protein, ...herbs].length,
        totalCount: ings.length,
      };
    },
  },

  // ── Poulet rôti / sauté ───────────────────────────────────────────────────
  {
    id: "chicken",
    name: (ings) => {
      const veggies = ings.filter(i => classify(i.name) === "veggie").slice(0, 1).map(i => i.name);
      return veggies.length ? `Poulet sauté aux ${veggies[0]}s` : "Poulet sauté du chef";
    },
    description: () => "Un poulet tendre et parfumé, sauté avec vos légumes du moment.",
    match: (c) => (c.protein ?? []).some(i => isChicken(i.name)),
    priority: (c) => (c.protein ?? []).some(i => isChicken(i.name)) ? 9 : 0,
    compose: (ings, c) => {
      const chicken = (c.protein ?? []).find(i => isChicken(i.name))!;
      const veggies = (c.veggie ?? []).slice(0, 3);
      const cream = (c.dairy ?? []).filter(i => isCream(i.name)).slice(0, 1);
      const starch = (c.starch ?? []).slice(0, 1);
      const steps: string[] = [
        `Coupez ${chicken.name} en morceaux ou lamelles. Salez et poivrez.`,
        "Faites chauffer une poêle à feu vif avec un filet d'huile.",
        `Faites dorer le poulet 5-6 min de chaque côté jusqu'à belle coloration.`,
      ];
      if (veggies.length > 0) steps.push(`Ajoutez ${veggies.map(v => v.name).join(", ")} coupés. Faites sauter 5-7 min.`);
      if (cream.length > 0) steps.push("Versez la crème, remuez et laissez mijoter 3 minutes.");
      else steps.push("Déglacez avec un peu d'eau ou de bouillon. Laissez réduire 2 min.");
      if (starch.length > 0) steps.push(`Servez avec ${starch[0].name} cuit à part.`);
      steps.push("Rectifiez l'assaisonnement et servez chaud.");
      return {
        prepTime: 10, cookTime: 20, servings: 2, difficulty: 2,
        modes: ["rapide", "sportif", "anti-gaspillage"],
        ingredients: [
          { name: chicken.name, quantity: qty(chicken) },
          ...veggies.map(v => ({ name: v.name, quantity: qty(v), optional: true })),
          ...cream.map(cr => ({ name: cr.name, quantity: qty(cr), optional: true })),
          ...starch.map(s => ({ name: s.name, quantity: qty(s), optional: true })),
          { name: "huile d'olive", quantity: "2 c.à.s" },
          { name: "sel et poivre", quantity: "au goût" },
        ],
        steps,
        tips: "Laissez reposer le poulet 2 minutes hors feu avant de servir pour garder tout le jus à l'intérieur.",
        nutritionScore: 88,
        antiWasteScore: 82,
        usedCount: [chicken, ...veggies, ...cream, ...starch].length,
        totalCount: ings.length,
      };
    },
  },

  // ── Gratin ────────────────────────────────────────────────────────────────
  {
    id: "gratin",
    name: (ings) => {
      const main = ings.filter(i => isPotato(i.name) || isZucchini(i.name)).slice(0, 1).map(i => i.name);
      return main.length ? `Gratin de ${main[0]}` : "Gratin maison";
    },
    description: () => "Un gratin gratiné et crémeux, le plat réconfort par excellence.",
    match: (c) => {
      const hasCream = (c.dairy ?? []).some(i => isCream(i.name));
      const hasCheese = (c.dairy ?? []).some(i => isCheese(i.name));
      const hasVeg = (c.veggie ?? []).some(i => isPotato(i.name) || isZucchini(i.name) || isCarrot(i.name));
      return (hasCream || hasCheese) && hasVeg;
    },
    priority: (c) => {
      const hasCream = (c.dairy ?? []).some(i => isCream(i.name));
      const hasVeg = (c.veggie ?? []).some(i => isPotato(i.name) || isZucchini(i.name));
      return hasCream && hasVeg ? 8 : 0;
    },
    compose: (ings, c) => {
      const veggies = (c.veggie ?? []).filter(i => isPotato(i.name) || isZucchini(i.name) || isCarrot(i.name)).slice(0, 3);
      const cream = (c.dairy ?? []).filter(i => isCream(i.name)).slice(0, 1);
      const cheese = (c.dairy ?? []).filter(i => isCheese(i.name)).slice(0, 1);
      const protein = (c.protein ?? []).filter(i => !isEgg(i.name)).slice(0, 1);
      const steps = [
        "Préchauffez le four à 180°C.",
        `Épluchez et coupez ${veggies.map(v => v.name).join(", ")} en tranches fines (2-3mm).`,
        "Frottez un plat à gratin avec de l'ail. Beurrez légèrement.",
        `Disposez les tranches en couches dans le plat.${protein.length > 0 ? ` Intercalez ${protein[0].name} entre les couches.` : ""}`,
        `${cream.length > 0 ? `Versez la crème sur l'ensemble. ` : ""}${cheese.length > 0 ? `Parsemez de ${cheese[0].name} râpé. ` : ""}Salez, poivrez, ajoutez une pincée de muscade.`,
        "Enfournez 35-45 minutes jusqu'à ce que le dessus soit bien doré et les légumes tendres.",
      ];
      return {
        prepTime: 20, cookTime: 40, servings: 4, difficulty: 2,
        modes: ["famille", "anti-gaspillage", ...(protein.length === 0 ? ["végétarien"] : [])],
        ingredients: [
          ...veggies.map(v => ({ name: v.name, quantity: qty(v) })),
          ...cream.map(cr => ({ name: cr.name, quantity: qty(cr) })),
          ...cheese.map(ch => ({ name: ch.name, quantity: qty(ch), optional: true })),
          ...protein.map(p => ({ name: p.name, quantity: qty(p), optional: true })),
          { name: "ail", quantity: "1 gousse" },
          { name: "noix de muscade", quantity: "1 pincée" },
          { name: "sel et poivre", quantity: "au goût" },
        ],
        steps,
        tips: "Couvrez de papier aluminium les 20 premières minutes, puis retirez-le pour bien gratiner.",
        nutritionScore: 72,
        antiWasteScore: 85,
        usedCount: [...veggies, ...cream, ...cheese, ...protein].length,
        totalCount: ings.length,
      };
    },
  },

  // ── Salade composée ───────────────────────────────────────────────────────
  {
    id: "salad",
    name: () => "Salade composée du frigo",
    description: () => "Une salade fraîche et nourrissante, assemblée avec ce que vous avez.",
    match: (c) => (c.veggie ?? []).length >= 2,
    priority: (c) => {
      const hasSalad = (c.veggie ?? []).some(i => i.name.toLowerCase().includes("salade"));
      return hasSalad ? 6 : 3;
    },
    compose: (ings, c) => {
      const veggies = (c.veggie ?? []).slice(0, 4);
      const protein = (c.protein ?? []).slice(0, 1);
      const dairy = (c.dairy ?? []).filter(i => isCheese(i.name)).slice(0, 1);
      const steps = [
        `Lavez et préparez ${veggies.map(v => v.name).join(", ")}.`,
        "Coupez les légumes en morceaux, tranches ou dés selon leur nature.",
        ...(protein.length > 0 ? [`Préparez ${protein[0].name} : coupez en morceaux ou émiettez.`] : []),
        "Dressez tous les ingrédients dans un grand saladier.",
        "Préparez une vinaigrette : 3 c.à.s d'huile d'olive, 1 c.à.s de vinaigre, sel, poivre, moutarde (optionnel). Émulsionnez bien.",
        "Assaisonnez juste avant de servir pour garder le croquant.",
      ];
      return {
        prepTime: 10, cookTime: 0, servings: 2, difficulty: 1,
        modes: ["rapide", "végétarien", "anti-gaspillage", "sportif"],
        ingredients: [
          ...veggies.map(v => ({ name: v.name, quantity: qty(v) })),
          ...protein.map(p => ({ name: p.name, quantity: qty(p), optional: true })),
          ...dairy.map(d => ({ name: d.name, quantity: qty(d), optional: true })),
          { name: "huile d'olive", quantity: "3 c.à.s" },
          { name: "vinaigre", quantity: "1 c.à.s" },
          { name: "sel et poivre", quantity: "au goût" },
        ],
        steps,
        tips: "Ajoutez des graines (tournesol, courge, sésame) pour du croquant et des protéines végétales.",
        nutritionScore: 90,
        antiWasteScore: 92,
        usedCount: [...veggies, ...protein, ...dairy].length,
        totalCount: ings.length,
      };
    },
  },
];

// ---------------------------------------------------------------------------
// Main composer function
// ---------------------------------------------------------------------------

export function composeRecipe(ingredients: Ingredient[]): ComposedRecipe {
  if (ingredients.length === 0) {
    return {
      title: "Frigo vide !",
      description: "Ajoutez des ingrédients dans l'onglet Frigo pour que le Chef puisse composer une recette.",
      prepTime: 0, cookTime: 0, servings: 0, difficulty: 1,
      modes: [], ingredients: [], steps: [], tips: "",
      nutritionScore: 0, antiWasteScore: 0, usedCount: 0, totalCount: 0,
    };
  }

  // Group by category
  const classified: Record<string, Ingredient[]> = {};
  for (const ing of ingredients) {
    const cat = classify(ing.name);
    if (!classified[cat]) classified[cat] = [];
    classified[cat].push(ing);
  }

  // Pick best template
  const scored = TEMPLATES
    .filter(t => t.match(classified))
    .map(t => ({ template: t, score: t.priority(classified) }))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    // Fallback: generic stir-fry
    const steps = [
      "Coupez tous vos ingrédients en morceaux.",
      "Faites chauffer une poêle avec un filet d'huile.",
      "Faites cuire les ingrédients en commençant par les plus durs.",
      "Assaisonnez avec sel, poivre et les épices disponibles.",
      "Servez chaud, accompagné de pain si vous en avez.",
    ];
    return {
      title: "Poêlée du chef anti-gaspi",
      description: "Une poêlée improvisée avec tout ce que vous avez — simple, rapide et zéro gâchis.",
      prepTime: 10, cookTime: 15, servings: 2, difficulty: 1,
      modes: ["rapide", "anti-gaspillage"],
      ingredients: ingredients.map(i => ({ name: i.name, quantity: qty(i) })),
      steps,
      tips: "Saupoudrez d'herbes fraîches ou sèches pour rehausser les saveurs.",
      nutritionScore: 70, antiWasteScore: 98,
      usedCount: ingredients.length, totalCount: ingredients.length,
    };
  }

  const best = scored[0].template;
  const partial = best.compose(ingredients, classified);

  return {
    title: best.name(ingredients),
    description: best.description(ingredients),
    prepTime: partial.prepTime ?? 15,
    cookTime: partial.cookTime ?? 20,
    servings: partial.servings ?? 2,
    difficulty: partial.difficulty ?? 1,
    modes: partial.modes ?? ["anti-gaspillage"],
    ingredients: partial.ingredients ?? [],
    steps: partial.steps ?? [],
    tips: partial.tips ?? "",
    nutritionScore: partial.nutritionScore ?? 75,
    antiWasteScore: partial.antiWasteScore ?? 85,
    usedCount: partial.usedCount ?? 0,
    totalCount: ingredients.length,
  };
}
