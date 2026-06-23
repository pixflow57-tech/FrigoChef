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
import { useProfile } from "@/contexts/ProfileContext";
import { useShopping } from "@/contexts/ShoppingContext";
import { useColors } from "@/hooks/useColors";

export default function RecipesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ingredients } = useFrigo();
  const { profile } = useProfile();
  const { addFromRecipe } = useShopping();
  const [selectedMode, setSelectedMode] = useState<RecipeMode | "tous">("tous");

  const fridgeNames = ingredients.map((i) => i.name);
  const hasFridge = ingredients.length > 0;

  const scoredRecipes = useMemo(() => {
    return RECIPES.map((r) => {
      const match = hasFridge ? getRecipeMatch(r, fridgeNames) : { score: 50, matched: [], missing: r.ingredients };
      return { recipe: r, score: match.score, missing: match.missing };
    })
      .filter(({ recipe }) =>
        selectedMode === "tous" ? true : recipe.modes.includes(selectedMode as RecipeMode)
      )
      .sort((a, b) => b.score - a.score);
  }, [ingredients, selectedMode, fridgeNames, hasFridge]);

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
          {scoredRecipes.length} recette{scoredRecipes.length !== 1 ? "s" : ""} disponible
          {scoredRecipes.length !== 1 ? "s" : ""}
          {ingredients.length > 0 ? ` avec ${ingredients.length} ingrédient${ingredients.length > 1 ? "s" : ""}` : ""}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.modeScroll}
        contentContainerStyle={styles.modeContent}
      >
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
          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: selectedMode === "tous" ? "#fff" : colors.mutedForeground }}>
            Tous
          </Text>
        </TouchableOpacity>
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
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Inter_500Medium",
                color: selectedMode === mode.key ? "#fff" : colors.mutedForeground,
              }}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {ingredients.length === 0 && (
        <View style={[styles.hintBanner, { backgroundColor: colors.primaryDark + "15", borderColor: colors.primary + "40" }]}>
          <Feather name="info" size={15} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.primaryDark }]}>
            Ajoutez des ingrédients dans votre frigo pour voir les meilleures recettes
          </Text>
        </View>
      )}

      {scoredRecipes.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="search" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Aucune recette trouvée
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Essayez un autre mode ou ajoutez plus d'ingrédients
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
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
