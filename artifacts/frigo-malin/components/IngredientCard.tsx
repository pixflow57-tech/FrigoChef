import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Ingredient } from "@/contexts/FrigoContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_COLORS: Record<string, string> = {
  légumes: "#48BB78",
  fruits: "#F6AD55",
  viandes: "#FC8181",
  poissons: "#63B3ED",
  laitages: "#F9A8D4",
  féculents: "#D4A574",
  "épices": "#A78BFA",
  autres: "#94A3B8",
};

interface Props {
  ingredient: Ingredient;
  onDelete: () => void;
}

function daysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function IngredientCard({ ingredient, onDelete }: Props) {
  const colors = useColors();
  const categoryColor = CATEGORY_COLORS[ingredient.category] ?? "#94A3B8";
  const days = daysUntilExpiry(ingredient.expiryDate);

  const isExpiringSoon = days !== null && days <= 3;
  const isExpired = days !== null && days < 0;

  const handleDelete = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: categoryColor }]} />
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {ingredient.name}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.quantity, { color: colors.mutedForeground }]}>
            {ingredient.quantity} {ingredient.unit}
          </Text>
          {days !== null && (
            <View
              style={[
                styles.expiryBadge,
                {
                  backgroundColor: isExpired
                    ? "#FEE2E2"
                    : isExpiringSoon
                      ? "#FEF3C7"
                      : colors.successLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.expiryText,
                  {
                    color: isExpired ? "#DC2626" : isExpiringSoon ? "#92400E" : "#166534",
                  },
                ]}
              >
                {isExpired
                  ? "Périmé"
                  : days === 0
                    ? "Auj."
                    : `${days}j`}
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantity: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  expiryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expiryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    padding: 4,
  },
});
