import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RecipeCard from "@/components/RecipeCard";
import { RECIPE_MODES, RECIPES, getRecipeMatch, type RecipeMode } from "@/constants/recipeData";
import { useFrigo } from "@/contexts/FrigoContext";
import { useShopping } from "@/contexts/ShoppingContext";
import { useColors } from "@/hooks/useColors";

type FilterMode = RecipeMode | "tous" | "pret";

export default function RecipesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ingredients } = useFrigo();
  const { addFromRecipe } = useShopping();
  const [selectedMode, setSelectedMode] = useState<FilterMode>("tous");

  const fridgeNames = ingredients.map((i) => i.name);
  const hasFridge = ingredients.length > 0;

  const scoredRecipes = useMemo(() => {
    return RECIPES.map((r) => {
      const match = hasFridge
        ? getRecipeMatch(r, fridgeNames)
        : { score: 50, matched: [], missing: r.ingredients };
      return { recipe: r, score: match.score, missing: match.missing };
    })
      .filter(({ score }) => {
        // When fridge is filled, hide recipes with 0 matching ingredients
        if (hasFridge && score === 0) return false;
        return true;
      })
      .filter(({ recipe, score }) => {
        if (selectedMode === "tous") return true;
        if (selectedMode === "pret") return score === 100;
        return recipe.modes.includes(selectedMode as RecipeMode);
      })
      .sort((a, b) => b.score - a.score);
  }, [ingredients, selectedMode, fridgeNames, hasFridge]);

  const readyCount = useMemo(() => {
    if (!hasFridge) return 0;
    return RECIPES.filter((r) => getRecipeMatch(r, fridgeNames).score === 100).length;
  }, [fridgeNames, hasFridge]);

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 + 80 : 80;

  const handleAddToShopping = (recipeId: string) => {
    const item = scoredRecipes.find(({ recipe }) => recipe.id === recipeId);
    if (!item || item.missing.length === 0) return;
    addFromRecipe(item.missing.map((m) => ({ name: m.name, quantity: m.quantity })));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Recettes</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {hasFridge
            ? `${scoredRecipes.length} recette${scoredRecipes.length !== 1 ? "s" : ""} avec vos ingrédients`
            : "Ajoutez des ingrédients pour voir vos recettes"}
        </Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.modeScroll}
        contentContainerStyle={styles.modeContent}
      >
        {/* Tous */}
        <TouchableOpacity
          onPress={() => setSelectedMode("tous")}
          style={[
            styles.modeChip,
            {
              backgroundColor: selectedMode === "tous" ? colors.primary : colors.card,
              borderColor: selectedMode === "tous" ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[styles.chipText, { color: selectedMode === "tous" ? "#fff" : colors.mutedForeground }]}>
            Tous
          </Text>
        </TouchableOpacity>

        {/* Prêt à cuisiner */}
        {hasFridge && (
          <TouchableOpacity
            onPress={() => setSelectedMode("pret")}
            style={[
              styles.modeChip,
              {
                backgroundColor: selectedMode === "pret" ? colors.primary : colors.card,
                borderColor: selectedMode === "pret" ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name="check-circle"
              size={13}
              color={selectedMode === "pret" ? "#fff" : colors.primary}
            />
            <Text style={[styles.chipText, { color: selectedMode === "pret" ? "#fff" : colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              Prêt à cuisiner
            </Text>
            {readyCount > 0 && (
              <View style={[styles.readyBadge, { backgroundColor: selectedMode === "pret" ? "#ffffff30" : colors.primary + "20" }]}>
                <Text style={[styles.readyBadgeText, { color: selectedMode === "pret" ? "#fff" : colors.primary }]}>
                  {readyCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Mode chips */}
        {RECIPE_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            onPress={() => setSelectedMode(mode.key)}
            style={[
              styles.modeChip,
              {
                backgroundColor: selectedMode === mode.key ? colors.accent : colors.card,
                borderColor: selectedMode === mode.key ? colors.accent : colors.border,
              },
            ]}
          >
            <Feather
              name={mode.icon as any}
              size={13}
              color={selectedMode === mode.key ? "#fff" : colors.mutedForeground}
            />
            <Text style={[styles.chipText, { color: selectedMode === mode.key ? "#fff" : colors.mutedForeground }]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Empty fridge hint */}
      {!hasFridge && (
        <View style={[styles.hintBanner, { backgroundColor: colors.primaryDark + "15", borderColor: colors.primary + "40" }]}>
          <Feather name="info" size={15} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.primaryDark }]}>
            Ajoutez des ingrédients dans l'onglet Frigo — les recettes se trieront selon ce que vous avez.
          </Text>
        </View>
      )}

      {/* "Prêt à cuisiner" banner */}
      {hasFridge && selectedMode === "pret" && readyCount === 0 && (
        <View style={[styles.hintBanner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="package" size={15} color={colors.mutedForeground} />
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            Aucune recette 100% réalisable. Ajoutez plus d'ingrédients ou complétez vos courses !
          </Text>
        </View>
      )}

      {/* Recipe list */}
      {scoredRecipes.length === 0 && hasFridge && selectedMode !== "pret" ? (
        <View style={styles.empty}>
          <Feather name="search" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Aucune recette correspondante
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Essayez un autre filtre ou ajoutez plus d'ingrédients dans votre frigo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={scoredRecipes}
          keyExtractor={(item) => item.recipe.id}
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item.recipe}
              matchScore={item.score}
              missingIngredients={item.missing}
              hasFridge={hasFridge}
              onAddToShopping={() => handleAddToShopping(item.recipe.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  modeScroll: { flexGrow: 0, marginBottom: 12 },
  modeContent: { paddingHorizontal: 20, gap: 8 },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  readyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  readyBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  hintBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  list: { paddingHorizontal: 16 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
