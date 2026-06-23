# Frigo Malin

Application mobile qui transforme les restes alimentaires en suggestions de recettes intelligentes — zéro gâchis, maximum plaisir.

## Run & Operate

- `pnpm --filter @workspace/frigo-malin run dev` — run the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port varies)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with Expo Router
- API: Express 5 (existing api-server)
- Storage: AsyncStorage (local, no DB in first build)
- Fonts: Inter (400/500/600/700)
- Icons: @expo/vector-icons (Feather)

## Where things live

- `artifacts/frigo-malin/` — Expo mobile app
- `artifacts/frigo-malin/constants/colors.ts` — design tokens (green + orange palette)
- `artifacts/frigo-malin/constants/recipeData.ts` — recipe database + scoring logic
- `artifacts/frigo-malin/contexts/` — FrigoContext, ShoppingContext, ProfileContext (AsyncStorage)
- `artifacts/frigo-malin/components/` — IngredientCard, RecipeCard, AddIngredientSheet
- `artifacts/frigo-malin/app/(tabs)/` — Frigo, Recettes, Courses, Profil screens
- `artifacts/frigo-malin/assets/images/` — AI-generated icon + food photos

## Architecture decisions

- **Frontend-only first build**: All data persisted via AsyncStorage (no DB). FrigoContext, ShoppingContext, ProfileContext each handle their own AsyncStorage key.
- **Local recipe scoring**: `scoreRecipe()` in recipeData.ts matches fridge ingredients to recipe requirements using normalized string matching. No backend AI needed.
- **15 curated recipes** with modes, nutrition scores, anti-waste scores, and required/optional ingredient flags.
- **Warm green + orange palette**: primary #3D9970, accent #F76C2F, background #F8FAF5.
- **AI integration deferred**: User declined Replit AI upgrade. AI recipe generation can be added later via api-server with user's own API key.

## Product

- **Frigo tab**: Inventory management — add/remove ingredients with category, quantity, expiry date. Shows expiry alerts. Filterable by category.
- **Recettes tab**: Smart recipe suggestions scored by ingredient match. Filterable by mode (anti-gaspillage, rapide, végétarien, sportif, famille, etc.). Add missing ingredients to shopping list.
- **Courses tab**: Shopping list with check-off, auto-generation from recipes.
- **Profil tab**: User preferences — cooking modes, level, servings. Stats overview.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- AI integration (OpenAI via Replit) requires paid plan — currently not set up.
- Never run `npx expo start` directly — use `restart_workflow` tool.
- Never create `app.config.ts` — use static `app.json` only.
- Hot reload is active — only restart workflow for dependency changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for mobile development guidelines
