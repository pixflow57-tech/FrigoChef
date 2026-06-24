import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddIngredientSheet from "@/components/AddIngredientSheet";
import IngredientCard from "@/components/IngredientCard";
import { INGREDIENT_CATEGORIES, type IngredientCategory } from "@/constants/recipeData";
import { useFrigo } from "@/contexts/FrigoContext";
import { useColors } from "@/hooks/useColors";

const ALL_CATEGORIES = [{ key: "tous", label: "Tous" }, ...INGREDIENT_CATEGORIES];

export default function FrigoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ingredients, addIngredient, removeIngredient, isLoading } = useFrigo();
  const [showSheet, setShowSheet] = useState(false);
  const [filter, setFilter] = useState<IngredientCategory | "tous">("tous");

  const filtered = useMemo(
    () =>
      filter === "tous" ? ingredients : ingredients.filter((i) => i.category === filter),
    [ingredients, filter]
  );

  const expiringSoon = ingredients.filter((i) => {
    if (!i.expiryDate) return false;
    const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 3;
  });

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 + 80 : 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Mon réfrigérateur
          </Text>
          <Text style={[styles.count, { color: colors.foreground }]}>
            {ingredients.length} ingrédient{ingredients.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSheet(true);
          }}
        >
          <Feather name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {expiringSoon.length > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: colors.warningLight, borderColor: "#F6AD55" }]}>
          <Feather name="alert-circle" size={16} color="#92400E" />
          <Text style={[styles.alertText, { color: "#92400E" }]}>
            {expiringSoon.length} produit{expiringSoon.length > 1 ? "s" : ""} expire{expiringSoon.length > 1 ? "nt" : ""} bientôt !
          </Text>
        </View>
      )}

      <FlatList
        data={ALL_CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setFilter(item.key as IngredientCategory | "tous")}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === item.key ? colors.primary : colors.card,
                borderColor: filter === item.key ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: filter === item.key ? "#fff" : colors.mutedForeground },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {filter === "tous" ? "Votre frigo est vide" : "Aucun ingrédient"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            {filter === "tous"
              ? "Ajoutez vos ingrédients pour obtenir des suggestions de recettes"
              : `Aucun ingrédient dans "${INGREDIENT_CATEGORIES.find((c) => c.key === filter)?.label}"`}
          </Text>
          {filter === "tous" && (
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowSheet(true)}
            >
              <Text style={styles.emptyBtnText}>Ajouter un ingrédient</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          renderItem={({ item }) => (
            <IngredientCard
              ingredient={item}
              onDelete={() => removeIngredient(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddIngredientSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onAdd={addIngredient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  count: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  alertBanner: {
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
  alertText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  filterList: { flexGrow: 0, marginBottom: 12 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: { paddingHorizontal: 20 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
