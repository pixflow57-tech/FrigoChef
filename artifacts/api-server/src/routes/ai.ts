import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

router.post("/ai/recipe", async (req, res) => {
  const { ingredients, preferences } = req.body as {
    ingredients: string[];
    preferences?: string;
  };

  if (!ingredients || ingredients.length === 0) {
    res.status(400).json({ error: "Aucun ingrédient fourni" });
    return;
  }

  const ingredientList = ingredients.join(", ");
  const prefStr = preferences ? `\nPréférences : ${preferences}` : "";

  const prompt = `Tu es un chef cuisinier français expert en cuisine anti-gaspi. 
L'utilisateur a ces ingrédients dans son frigo : ${ingredientList}.${prefStr}

Génère UNE recette créative, savoureuse et pratique qui utilise un maximum de ces ingrédients.

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "title": "Nom de la recette",
  "description": "Description courte et appétissante (2 phrases)",
  "prepTime": 10,
  "cookTime": 20,
  "servings": 2,
  "difficulty": 1,
  "modes": ["rapide"],
  "ingredients": [
    { "name": "nom de l'ingrédient", "quantity": "quantité", "optional": false }
  ],
  "steps": [
    "Étape 1 : description",
    "Étape 2 : description"
  ],
  "tips": "Conseil du chef (optionnel)",
  "nutritionScore": 75,
  "antiWasteScore": 90
}

Règles :
- difficulty est 1 (facile), 2 (moyen) ou 3 (difficile)
- modes peut contenir : "anti-gaspillage", "rapide", "végétarien", "vegan", "sportif", "famille", "gourmet", "économique"
- nutritionScore et antiWasteScore sont entre 0 et 100
- Utilise en priorité les ingrédients listés
- La recette doit être réalisable avec des ustensiles de cuisine ordinaires
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "Réponse vide de l'IA" });
      return;
    }

    const recipe = JSON.parse(content);
    res.json({ recipe });
  } catch (err) {
    req.log.error({ err }, "AI recipe generation failed");
    const e = err as { status?: number; code?: string };
    if (e.status === 429 || e.code === "insufficient_quota") {
      res.status(402).json({
        error:
          "Quota OpenAI insuffisant. Ajoutez des crédits sur platform.openai.com → Billing pour activer le Chef IA.",
      });
      return;
    }
    if (e.status === 401) {
      res.status(401).json({ error: "Clé API OpenAI invalide. Vérifiez votre clé dans les secrets." });
      return;
    }
    res.status(500).json({ error: "Erreur lors de la génération de la recette. Réessayez." });
  }
});

export default router;
