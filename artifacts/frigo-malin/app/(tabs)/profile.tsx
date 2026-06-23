import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RECIPE_MODES } from "@/constants/recipeData";
import { useFrigo } from "@/contexts/FrigoContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useShopping } from "@/contexts/ShoppingContext";
import { useColors } from "@/hooks/useColors";

const COOKING_LEVELS = ["débutant", "intermédiaire", "expert"] as const;
const SERVINGS_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, toggleMode } = useProfile();
  const { ingredients } = useFrigo();
  const { items } = useShopping();

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 + 80 : 80;

  const expiringCount = ingredients.filter((i) => {
    if (!i.expiryDate) return false;
    const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 3;
  }).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mon profil</Text>

      <View style={[styles.statsRow]}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{ingredients.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Ingrédients</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: expiringCount > 0 ? colors.warning : colors.primary }]}>
            {expiringCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Expirent bientôt</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.accent }]}>{items.filter((i) => !i.checked).length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>À acheter</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mon prénom</Text>
        <TextInput
          value={profile.name}
          onChangeText={(name) => updateProfile({ name })}
          placeholder="Ex : Sophie"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.nameInput, { borderColor: colors.border, color: colors.foreground }]}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mes modes de cuisine</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          Personnalisez vos suggestions de recettes
        </Text>
        <View style={styles.modesGrid}>
          {RECIPE_MODES.map((mode) => {
            const active = profile.activeModes.includes(mode.key);
            return (
              <TouchableOpacity
                key={mode.key}
                onPress={() => toggleMode(mode.key)}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: active ? colors.primary + "15" : colors.muted,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name={mode.icon as any}
                  size={18}
                  color={active ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.modeLabel,
                    { color: active ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {mode.label}
                </Text>
                {active && (
                  <View style={[styles.modeDot, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Niveau de cuisine</Text>
        <View style={styles.levelRow}>
          {COOKING_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => updateProfile({ cookingLevel: level })}
              style={[
                styles.levelChip,
                {
                  backgroundColor: profile.cookingLevel === level ? colors.primary : colors.muted,
                  flex: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.levelText,
                  { color: profile.cookingLevel === level ? "#fff" : colors.mutedForeground },
                ]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nombre de personnes</Text>
        <View style={styles.servingsRow}>
          {SERVINGS_OPTIONS.map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => updateProfile({ servings: n })}
              style={[
                styles.servingsBtn,
                {
                  backgroundColor: profile.servings === n ? colors.primary : colors.muted,
                  borderColor: profile.servings === n ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.servingsText,
                  { color: profile.servings === n ? "#fff" : colors.mutedForeground },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.sloganBox, { backgroundColor: colors.primaryDark + "12" }]}>
        <Text style={[styles.slogan, { color: colors.primaryDark }]}>
          « Zéro gâchis, maximum plaisir. Votre frigo devient votre meilleur chef. »
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  statNum: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 2,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  modesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    position: "relative",
  },
  modeLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  modeDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
  },
  levelChip: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  levelText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  servingsRow: {
    flexDirection: "row",
    gap: 8,
  },
  servingsBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  servingsText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sloganBox: {
    marginHorizontal: 20,
    marginTop: 6,
    padding: 16,
    borderRadius: 14,
  },
  slogan: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 20,
    textAlign: "center",
  },
});
