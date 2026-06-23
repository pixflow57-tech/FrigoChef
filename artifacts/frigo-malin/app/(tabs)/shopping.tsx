import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShopping } from "@/contexts/ShoppingContext";
import { useColors } from "@/hooks/useColors";

export default function ShoppingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, addItem, toggleItem, removeItem, clearChecked } = useShopping();
  const [newItemName, setNewItemName] = useState("");

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 34 + 80 : 80;

  const handleAdd = () => {
    if (!newItemName.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(newItemName.trim());
    setNewItemName("");
  };

  const handleToggle = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleItem(id);
  };

  const allData = [
    ...unchecked,
    ...(checked.length > 0 ? [{ id: "__separator__", name: "", quantity: "", checked: false, addedAt: "" }] : []),
    ...checked,
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Liste de courses</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {unchecked.length} article{unchecked.length !== 1 ? "s" : ""} restant{unchecked.length !== 1 ? "s" : ""}
          </Text>
        </View>
        {checked.length > 0 && (
          <TouchableOpacity
            onPress={clearChecked}
            style={[styles.clearBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Effacer cochés</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          value={newItemName}
          onChangeText={setNewItemName}
          placeholder="Ajouter un article..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleAdd}
          style={[
            styles.addBtn,
            { backgroundColor: newItemName.trim() ? colors.primary : colors.muted },
          ]}
          disabled={!newItemName.trim()}
        >
          <Feather name="plus" size={20} color={newItemName.trim() ? "#fff" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Feather name="shopping-cart" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Liste vide
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Ajoutez des articles ou générez la liste depuis une recette
          </Text>
        </View>
      ) : (
        <FlatList
          data={allData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.id === "__separator__") {
              return (
                <View style={[styles.separator, { borderColor: colors.border }]}>
                  <Text style={[styles.separatorText, { color: colors.mutedForeground }]}>
                    Déjà dans le panier ({checked.length})
                  </Text>
                </View>
              );
            }
            return (
              <View
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: item.checked ? 0.6 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleToggle(item.id)}
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: item.checked ? colors.primary : "transparent",
                      borderColor: item.checked ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {item.checked && <Feather name="check" size={13} color="#fff" />}
                </TouchableOpacity>
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemName,
                      {
                        color: colors.foreground,
                        textDecorationLine: item.checked ? "line-through" : "none",
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.quantity !== "1" && (
                    <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>
                      {item.quantity}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={8}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
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
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  clearText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 13,
  },
  addBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: 20 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: { flex: 1 },
  itemName: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  itemQty: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  separator: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  separatorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
