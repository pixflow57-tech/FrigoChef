import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFrigo } from "@/contexts/FrigoContext";
import { useColors } from "@/hooks/useColors";

interface AIRecipe {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 1 | 2 | 3;
  modes: string[];
  ingredients: { name: string; quantity: string; optional?: boolean }[];
  steps: string[];
  tips?: string;
  nutritionScore: number;
  antiWasteScore: number;
}

const DIFFICULTY_LABEL: Record<number, string> = {
  1: "Facile",
  2: "Moyen",
  3: "Difficile",
};

const API_BASE =
  Platform.OS === "web"
    ? "/api"
    : process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:80/api";

export default function ChefScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ingredients } = useFrigo();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<AIRecipe | null>(null);

  const toggleIngredient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(ingredients.map((i) => i.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const generate = async () => {
    const chosen = ingredients.filter((i) => selectedIds.has(i.id));
    if (chosen.length === 0) return;

    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const body = JSON.stringify({
        ingredients: chosen.map((i) => `${i.name} (${i.quantity} ${i.unit})`),
        preferences: "cuisine française, recette pratique du quotidien",
      });

      const res = await fetch(`${API_BASE}/ai/recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Erreur serveur");
      }

      const data = (await res.json()) as { recipe: AIRecipe };
      setRecipe(data.recipe);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Chef IA</Text>
          <Text style={s.headerSub}>Recette personnalisée depuis votre frigo</Text>
        </View>
        <View style={s.aiBadge}>
          <Feather name="zap" size={14} color={colors.accentForeground} />
          <Text style={s.aiLabel}>GPT-4o</Text>
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
                  <Text style={s.textBtnLabel}>Tout</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearAll} style={s.textBtn}>
                  <Text style={s.textBtnLabelMuted}>Aucun</Text>
                </TouchableOpacity>
              </View>
            </View>

            {ingredients.length === 0 ? (
              <View style={s.emptyBox}>
                <Feather name="inbox" size={32} color={colors.mutedForeground} />
                <Text style={s.emptyText}>
                  Votre frigo est vide. Ajoutez des ingrédients dans l'onglet Frigo.
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
                        size={15}
                        color={selected ? colors.primaryForeground : colors.mutedForeground}
                        style={s.chipIcon}
                      />
                      <Text
                        style={[s.chipText, selected && s.chipTextSelected]}
                        numberOfLines={1}
                      >
                        {ing.name}
                      </Text>
                      <Text
                        style={[s.chipQty, selected && s.chipQtySelected]}
                        numberOfLines={1}
                      >
                        {ing.quantity} {ing.unit}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Feather name="alert-circle" size={18} color={colors.destructive} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={s.loadingText}>Le chef IA prépare votre recette…</Text>
          </View>
        )}

        {/* Generated Recipe */}
        {recipe && !loading && (
          <View>
            {/* Back button */}
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => {
                setRecipe(null);
                setError(null);
              }}
            >
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Text style={s.backBtnText}>Nouvelle recette</Text>
            </TouchableOpacity>

            {/* Recipe card */}
            <View style={s.recipeCard}>
              {/* Title & meta */}
              <View style={s.recipeHeader}>
                <View style={s.aiGeneratedBadge}>
                  <Feather name="zap" size={11} color={colors.accent} />
                  <Text style={s.aiGeneratedLabel}>Généré par IA</Text>
                </View>
                <Text style={s.recipeTitle}>{recipe.title}</Text>
                <Text style={s.recipeDesc}>{recipe.description}</Text>
              </View>

              {/* Stats row */}
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
                  <Feather name="leaf" size={14} color={colors.primary} />
                  <Text style={[s.statValue, { color: colors.primary }]}>
                    {recipe.antiWasteScore}%
                  </Text>
                  <Text style={s.statLabel}>Anti-gaspi</Text>
                </View>
              </View>

              {/* Modes */}
              {recipe.modes?.length > 0 && (
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
              <Text style={s.sectionH2}>Ingrédients</Text>
              {recipe.ingredients.map((ing, i) => (
                <View key={i} style={s.ingRow}>
                  <View style={[s.ingDot, ing.optional && s.ingDotOpt]} />
                  <Text style={s.ingName}>{ing.name}</Text>
                  <Text style={s.ingQty}>{ing.quantity}</Text>
                  {ing.optional && <Text style={s.ingOpt}>(optionnel)</Text>}
                </View>
              ))}
            </View>

            {/* Steps */}
            <View style={s.section}>
              <Text style={s.sectionH2}>Préparation</Text>
              {recipe.steps.map((step, i) => (
                <View key={i} style={s.stepRow}>
                  <View style={s.stepNum}>
                    <Text style={s.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.stepText}>{step.replace(/^Étape \d+ ?:? ?/i, "")}</Text>
                </View>
              ))}
            </View>

            {/* Tips */}
            {recipe.tips && (
              <View style={s.tipsBox}>
                <Feather name="star" size={15} color={colors.accent} />
                <Text style={s.tipsText}>{recipe.tips}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Generate button */}
      {!recipe && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              s.generateBtn,
              (selectedIds.size === 0 || loading) && s.generateBtnDisabled,
            ]}
            onPress={generate}
            disabled={selectedIds.size === 0 || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="zap" size={18} color="#fff" />
            )}
            <Text style={s.generateBtnText}>
              {loading
                ? "Génération en cours…"
                : selectedIds.size === 0
                  ? "Sélectionnez des ingrédients"
                  : `Générer avec ${selectedIds.size} ingrédient${selectedIds.size > 1 ? "s" : ""}`}
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
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    headerSub: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 2,
    },
    aiBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    aiLabel: {
      color: colors.accentForeground,
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    scroll: { flex: 1 },
    content: { padding: 20, gap: 16 },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    sectionActions: { flexDirection: "row", gap: 8 },
    textBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    textBtnLabel: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.primary,
    },
    textBtnLabelMuted: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
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
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 24,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
      maxWidth: "48%",
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipIcon: {},
    chipText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.foreground,
      flexShrink: 1,
    },
    chipTextSelected: { color: colors.primaryForeground },
    chipQty: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    chipQtySelected: { color: "rgba(255,255,255,0.8)" },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#FFF5F5",
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: "#FED7D7",
    },
    errorText: {
      flex: 1,
      color: colors.destructive,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    loadingBox: { alignItems: "center", gap: 16, paddingVertical: 40 },
    loadingText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 16,
    },
    backBtnText: {
      color: colors.primary,
      fontFamily: "Inter_500Medium",
      fontSize: 14,
    },
    recipeCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      marginBottom: 16,
    },
    recipeHeader: { padding: 20, gap: 8 },
    aiGeneratedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      backgroundColor: colors.accentLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    aiGeneratedLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: colors.accent,
    },
    recipeTitle: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    recipeDesc: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      lineHeight: 20,
    },
    statsRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 12,
    },
    statItem: { flex: 1, alignItems: "center", gap: 2 },
    statValue: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    statLabel: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    statDivider: { width: 1, backgroundColor: colors.border },
    modesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    modeTag: {
      backgroundColor: colors.secondary,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    modeTagText: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: colors.primary,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 12,
      gap: 10,
    },
    sectionH2: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      marginBottom: 4,
    },
    ingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    ingDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    ingDotOpt: { backgroundColor: colors.border },
    ingName: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    ingQty: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    ingOpt: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      fontStyle: "italic",
    },
    stepRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    stepNum: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginTop: 1,
    },
    stepNumText: {
      color: colors.primaryForeground,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
    },
    stepText: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      lineHeight: 22,
    },
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
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      lineHeight: 20,
      fontStyle: "italic",
    },
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
      paddingHorizontal: 24,
    },
    generateBtnDisabled: { backgroundColor: colors.muted },
    generateBtnText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
