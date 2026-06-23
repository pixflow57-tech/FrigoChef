import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Recipe } from "@/constants/recipeData";
import { useColors } from "@/hooks/useColors";

const DIFFICULTY_LABELS = ["", "Facile", "Moyen", "Expert"];
const DIFFICULTY_COLORS = ["", "#48BB78", "#F6AD55", "#FC8181"];

const IMAGES: Record<string, number> = {
  pasta: require("@/assets/images/recipe_pasta.png"),
  salad: require("@/assets/images/recipe_salad.png"),
  hero: require("@/assets/images/hero_food.png"),
};

interface Props {
  recipe: Recipe;
  matchScore: number;
  onAddToShopping: () => void;
}

export default function RecipeCard({ recipe, matchScore, onAddToShopping }: Props) {
  const colors = useColors();
  const totalTime = recipe.prepTime + recipe.cookTime;

  const handleAddToShopping = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAddToShopping();
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, shadowColor: colors.border },
      ]}
    >
      {recipe.imageKey && IMAGES[recipe.imageKey] ? (
        <Image
          source={IMAGES[recipe.imageKey]}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
          <Feather name="coffee" size={32} color={colors.mutedForeground} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {recipe.title}
          </Text>
          {matchScore > 0 && (
            <View style={[styles.scoreBadge, { backgroundColor: colors.primaryDark }]}>
              <Text style={styles.scoreText}>{Math.min(matchScore, 99)}%</Text>
            </View>
          )}
        </View>

        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
          {recipe.description}
        </Text>

        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
              {totalTime} min
            </Text>
          </View>
          <View
            style={[
              styles.tag,
              { backgroundColor: DIFFICULTY_COLORS[recipe.difficulty] + "20" },
            ]}
          >
            <Text
              style={[styles.tagText, { color: DIFFICULTY_COLORS[recipe.difficulty] }]}
            >
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
            <Feather name="users" size={11} color={colors.mutedForeground} />
            <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
              {recipe.servings} pers.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.scores}>
            <View style={styles.scoreItem}>
              <Feather name="heart" size={12} color={colors.accent} />
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
                Nutri {recipe.nutritionScore}
              </Text>
            </View>
            <View style={styles.scoreItem}>
              <Feather name="refresh-cw" size={12} color={colors.primary} />
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
                Anti-gaspi {recipe.antiWasteScore}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.shoppingBtn, { backgroundColor: colors.accentLight }]}
            onPress={handleAddToShopping}
          >
            <Feather name="shopping-cart" size={14} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 160,
  },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 14,
    gap: 8,
  },
  header: {
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  scores: {
    flexDirection: "row",
    gap: 12,
  },
  scoreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  shoppingBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
