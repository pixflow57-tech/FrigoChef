import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Recipe, RecipeIngredient } from "@/constants/recipeData";
import { useColors } from "@/hooks/useColors";

const DIFFICULTY_LABELS = ["", "Facile", "Moyen", "Expert"];

const IMAGES: Record<string, number> = {
  pasta: require("@/assets/images/recipe_pasta.png"),
  salad: require("@/assets/images/recipe_salad.png"),
  hero: require("@/assets/images/hero_food.png"),
};

interface Props {
  recipe: Recipe;
  /** 0-100: % of ingredients already in fridge */
  matchScore: number;
  /** Ingredients missing from fridge */
  missingIngredients: RecipeIngredient[];
  hasFridge: boolean;
  onAddToShopping: () => void;
}

function scoreColor(score: number, colors: ReturnType<typeof useColors>): string {
  if (score === 100) return colors.primary;
  if (score >= 66) return "#F6AD55";
  if (score >= 33) return colors.accent;
  return "#FC8181";
}

export default function RecipeCard({ recipe, matchScore, missingIngredients, hasFridge, onAddToShopping }: Props) {
  const colors = useColors();
  const totalTime = recipe.prepTime + recipe.cookTime;
  const color = scoreColor(matchScore, colors);
  const totalIngCount = recipe.ingredients.length;
  const ownedCount = totalIngCount - missingIngredients.length;

  const handleAddToShopping = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAddToShopping();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Image or placeholder */}
      {recipe.imageKey && IMAGES[recipe.imageKey] ? (
        <Image source={IMAGES[recipe.imageKey]} style={styles.image} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
          <Feather name="coffee" size={28} color={colors.mutedForeground} />
        </View>
      )}

      <View style={styles.body}>
        {/* Title row + score badge */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {recipe.title}
          </Text>
          {hasFridge && (
            <View style={[styles.scoreBadge, { backgroundColor: color }]}>
              <Text style={styles.scoreBadgeText}>{matchScore}%</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        {hasFridge && (
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${matchScore}%` as `${number}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              {ownedCount}/{totalIngCount} ingrédients
            </Text>
          </View>
        )}

        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
          {recipe.description}
        </Text>

        {/* Missing ingredients */}
        {hasFridge && missingIngredients.length > 0 && (
          <View style={[styles.missingBox, { backgroundColor: colors.muted }]}>
            <Feather name="alert-circle" size={12} color={colors.mutedForeground} style={{ marginTop: 1 }} />
            <Text style={[styles.missingText, { color: colors.mutedForeground }]} numberOfLines={2}>
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>Manque : </Text>
              {missingIngredients.map(i => i.name).join(", ")}
            </Text>
          </View>
        )}

        {/* Meta tags */}
        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{totalTime} min</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
            <Feather name="users" size={11} color={colors.mutedForeground} />
            <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{recipe.servings} pers.</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.modesRow}>
            {recipe.modes.slice(0, 2).map(m => (
              <View key={m} style={[styles.modeTag, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.modeText, { color: colors.primary }]}>{m}</Text>
              </View>
            ))}
          </View>
          {missingIngredients.length > 0 && (
            <TouchableOpacity
              style={[styles.shoppingBtn, { backgroundColor: colors.accentLight }]}
              onPress={handleAddToShopping}
            >
              <Feather name="shopping-cart" size={13} color={colors.accent} />
              <Text style={[styles.shoppingBtnText, { color: colors.accent }]}>Ajouter</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: "100%", height: 150 },
  imagePlaceholder: {
    width: "100%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 14, gap: 8 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  scoreBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 44,
    alignItems: "center",
  },
  scoreBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    minWidth: 80,
    textAlign: "right",
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  missingBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  missingText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  tags: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  modesRow: { flexDirection: "row", gap: 6, flex: 1 },
  modeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  shoppingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  shoppingBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
