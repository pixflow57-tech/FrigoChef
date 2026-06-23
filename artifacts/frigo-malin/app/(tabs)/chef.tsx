import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFrigo } from "@/contexts/FrigoContext";
import { useColors } from "@/hooks/useColors";
import { composeRecipe, type ComposedRecipe } from "@/constants/recipeComposer";

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "Facile",
  2: "Moyen",
  3: "Difficile",
};

export default function ChefScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ingredients } = useFrigo();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recipe, setRecipe] = useState<ComposedRecipe | null>(null);

  const toggleIngredient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(ingredients.map((i) => i.id)));
  const clearAll = () => setSelectedIds(new Set());

  const generate = () => {
    const chosen = ingredients.filter((i) => selectedIds.has(i.id));
    if (chosen.length === 0) return;
    const result = composeRecipe(chosen);
    setRecipe(result);
  };

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Chef IA</Text>
          <Text style={s.headerSub}>Recette composée depuis votre frigo</Text>
        </View>
        <View style={s.badge}>
          <Feather name="zap" size={13} color="#fff" />
          <Text style={s.badgeText}>Local</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ingredient picker */}
        {!recipe && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                Choisissez vos ingrédients ({selectedIds.size}/{ingredients.length})
              </Text>
              <View style={s.sectionActions}>
                <TouchableOpacity onPress={selectAll} style={s.textBtn}>
                  <Text style={s.textBtnPrimary}>Tout</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearAll} style={s.textBtn}>
                  <Text style={s.textBtnMuted}>Aucun</Text>
                </TouchableOpacity>
              </View>
            </View>

            {ingredients.length === 0 ? (
              <View style={s.emptyBox}>
                <Feather name="inbox" size={32} color={colors.mutedForeground} />
                <Text style={s.emptyText}>
                  Votre frigo est vide.{"\n"}Ajoutez des ingrédients dans l'onglet Frigo.
                </Text>
              </View>
            ) : (
              <View style={s.grid}>
                {ingredients.map((ing) => {
                  const selected = selectedIds.has(ing.id);
                  return (
                    <TouchableOpacity
                      key={ing.id}
                      onPress={() => toggleIngredient(ing.id)}
                      style={[s.chip, selected && s.chipSelected]}
                      activeOpacity={0.7}
                    >
                      <Feather
                        name={selected ? "check-circle" : "circle"}
                        size={14}
                        color={selected ? "#fff" : colors.mutedForeground}
                      />
                      <Text style={[s.chipText, selected && s.chipTextSelected]} numberOfLines={1}>
                        {ing.name}
                      </Text>
                      <Text style={[s.chipQty, selected && s.chipQtySelected]} numberOfLines={1}>
                        {ing.quantity} {ing.unit}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Generated Recipe */}
        {recipe && (
          <View>
            {/* Back */}
            <TouchableOpacity style={s.backBtn} onPress={() => setRecipe(null)}>
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Text style={s.backBtnText}>Nouvelle recette</Text>
            </TouchableOpacity>

            {/* Usage banner */}
            <View style={s.usageBanner}>
              <Feather name="check-circle" size={15} color={colors.primary} />
              <Text style={s.usageText}>
                <Text style={s.usageBold}>{recipe.usedCount}</Text> ingrédient
                {recipe.usedCount > 1 ? "s" : ""} de votre frigo utilisé
                {recipe.usedCount > 1 ? "s" : ""}
              </Text>
              <View style={s.antiWastePill}>
                <Text style={s.antiWasteText}>Anti-gaspi {recipe.antiWasteScore}%</Text>
              </View>
            </View>

            {/* Recipe header card */}
            <View style={s.recipeCard}>
              <View style={s.recipeHeader}>
                <View style={s.composedBadge}>
                  <Feather name="cpu" size={11} color={colors.primary} />
                  <Text style={s.composedBadgeText}>Composée par le Chef</Text>
                </View>
                <Text style={s.recipeTitle}>{recipe.title}</Text>
                <Text style={s.recipeDesc}>{recipe.description}</Text>
              </View>

              {/* Stats */}
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Feather name="clock" size={14} color={colors.mutedForeground} />
                  <Text style={s.statValue}>{recipe.prepTime + recipe.cookTime} min</Text>
                  <Text style={s.statLabel}>Total</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Feather name="users" size={14} color={colors.mutedForeground} />
                  <Text style={s.statValue}>{recipe.servings}</Text>
                  <Text style={s.statLabel}>Pers.</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Feather name="bar-chart-2" size={14} color={colors.mutedForeground} />
                  <Text style={s.statValue}>{DIFFICULTY_LABEL[recipe.difficulty]}</Text>
                  <Text style={s.statLabel}>Niveau</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Feather name="heart" size={14} color={colors.primary} />
                  <Text style={[s.statValue, { color: colors.primary }]}>{recipe.nutritionScore}%</Text>
                  <Text style={s.statLabel}>Nutrition</Text>
                </View>
              </View>

              {/* Modes */}
              {recipe.modes.length > 0 && (
                <View style={s.modesRow}>
                  {recipe.modes.map((m) => (
                    <View key={m} style={s.modeTag}>
                      <Text style={s.modeTagText}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Ingredients */}
            <View style={s.section}>
              <Text style={s.sectionH2}>
                <Feather name="list" size={15} color={colors.foreground} />{"  "}Ingrédients
              </Text>
              {recipe.ingredients.map((ing, i) => (
                <View key={i} style={s.ingRow}>
                  <View style={[s.ingDot, ing.optional ? s.ingDotOpt : s.ingDotRequired]} />
                  <Text style={s.ingName}>{ing.name}</Text>
                  <Text style={s.ingQty}>{ing.quantity}</Text>
                  {ing.optional && <Text style={s.ingOpt}>(opt.)</Text>}
                </View>
              ))}
            </View>

            {/* Steps */}
            <View style={s.section}>
              <Text style={s.sectionH2}>
                <Feather name="play-circle" size={15} color={colors.foreground} />{"  "}Préparation
              </Text>
              {recipe.steps.map((step, i) => (
                <View key={i} style={s.stepRow}>
                  <View style={s.stepNum}>
                    <Text style={s.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Tips */}
            {recipe.tips ? (
              <View style={s.tipsBox}>
                <Feather name="star" size={15} color={colors.accent} />
                <Text style={s.tipsText}>{recipe.tips}</Text>
              </View>
            ) : null}

            {/* Regenerate */}
            <TouchableOpacity style={s.regenBtn} onPress={generate} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={16} color={colors.primary} />
              <Text style={s.regenBtnText}>Varier la recette</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Generate button */}
      {!recipe && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[s.generateBtn, selectedIds.size === 0 && s.generateBtnDisabled]}
            onPress={generate}
            disabled={selectedIds.size === 0}
            activeOpacity={0.85}
          >
            <Feather name="zap" size={18} color="#fff" />
            <Text style={s.generateBtnText}>
              {selectedIds.size === 0
                ? "Sélectionnez des ingrédients"
                : `Composer une recette avec ${selectedIds.size} ingrédient${selectedIds.size > 1 ? "s" : ""}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function styles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    badgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
    scroll: { flex: 1 },
    content: { padding: 20, gap: 14 },

    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    sectionActions: { flexDirection: "row", gap: 6 },
    textBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    textBtnPrimary: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.primary },
    textBtnMuted: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },

    emptyBox: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 48,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyText: {
      textAlign: "center",
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      paddingHorizontal: 24,
      lineHeight: 22,
    },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 24,
      paddingHorizontal: 11,
      paddingVertical: 8,
      gap: 5,
      maxWidth: "48%",
    },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, flexShrink: 1 },
    chipTextSelected: { color: "#fff" },
    chipQty: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    chipQtySelected: { color: "rgba(255,255,255,0.75)" },

    backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
    backBtnText: { color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 14 },

    usageBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.successLight,
      borderRadius: 12,
      padding: 12,
      marginBottom: 2,
    },
    usageText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground },
    usageBold: { fontFamily: "Inter_600SemiBold" },
    antiWastePill: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    antiWasteText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },

    recipeCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    recipeHeader: { padding: 18, gap: 8 },
    composedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      backgroundColor: colors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    composedBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.primary },
    recipeTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    recipeDesc: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 20 },

    statsRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 12,
    },
    statItem: { flex: 1, alignItems: "center", gap: 2 },
    statValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    statDivider: { width: 1, backgroundColor: colors.border },

    modesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      paddingHorizontal: 18,
      paddingBottom: 14,
    },
    modeTag: {
      backgroundColor: colors.secondary,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    modeTagText: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.primary },

    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      gap: 10,
    },
    sectionH2: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 },

    ingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    ingDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
    ingDotRequired: { backgroundColor: colors.primary },
    ingDotOpt: { backgroundColor: colors.border },
    ingName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground },
    ingQty: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    ingOpt: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, fontStyle: "italic" },

    stepRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    stepNum: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
      flexShrink: 0, marginTop: 1,
    },
    stepNumText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
    stepText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 22 },

    tipsBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: colors.accentLight,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.accent + "33",
    },
    tipsText: {
      flex: 1, fontSize: 13, fontFamily: "Inter_400Regular",
      color: colors.foreground, lineHeight: 20, fontStyle: "italic",
    },

    regenBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      marginTop: 4,
    },
    regenBtnText: { color: colors.primary, fontSize: 15, fontFamily: "Inter_600SemiBold" },

    footer: {
      padding: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    generateBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
    },
    generateBtnDisabled: { backgroundColor: colors.muted },
    generateBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
