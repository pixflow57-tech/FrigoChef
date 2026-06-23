import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INGREDIENT_CATEGORIES, type IngredientCategory } from "@/constants/recipeData";
import { useColors } from "@/hooks/useColors";

const COMMON_UNITS = ["g", "kg", "ml", "L", "pièce(s)", "c.à.s", "c.à.c", "boîte(s)", "sachet(s)"];

const SUGGESTIONS: Record<IngredientCategory, string[]> = {
  légumes: ["Tomate", "Carotte", "Courgette", "Poivron", "Oignon", "Ail", "Salade", "Brocoli", "Épinards"],
  fruits: ["Banane", "Pomme", "Orange", "Citron", "Fraises", "Raisins"],
  viandes: ["Poulet", "Boeuf", "Porc", "Jambon", "Lardons", "Steak haché"],
  poissons: ["Saumon", "Thon", "Cabillaud", "Crevettes"],
  laitages: ["Lait", "Oeufs", "Fromage râpé", "Yaourt grec", "Crème fraîche", "Beurre"],
  féculents: ["Pâtes", "Riz", "Pomme de terre", "Farine", "Quinoa", "Semoule"],
  "épices": ["Sel", "Poivre", "Curry", "Paprika", "Cumin", "Herbes de Provence", "Sauce soja"],
  autres: ["Huile d'olive", "Bouillon", "Miel", "Sucre", "Lait de coco"],
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (ingredient: {
    name: string;
    quantity: string;
    unit: string;
    category: IngredientCategory;
    expiryDate?: string;
  }) => void;
}

export default function AddIngredientSheet({ visible, onClose, onAdd }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pièce(s)");
  const [category, setCategory] = useState<IngredientCategory>("légumes");
  const [expiryDate, setExpiryDate] = useState("");
  const nameRef = useRef<TextInput>(null);

  const suggestions = SUGGESTIONS[category].filter(
    (s) => name.length === 0 || s.toLowerCase().includes(name.toLowerCase())
  );

  const handleAdd = () => {
    if (!name.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({ name: name.trim(), quantity, unit, category, expiryDate: expiryDate || undefined });
    setName("");
    setQuantity("1");
    setUnit("pièce(s)");
    setCategory("légumes");
    setExpiryDate("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View style={[styles.overlay]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>Ajouter un ingrédient</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {INGREDIENT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor:
                        category === cat.key ? colors.primary : colors.secondary,
                      borderColor: category === cat.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catLabel,
                      { color: category === cat.key ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Nom</Text>
            <TextInput
              ref={nameRef}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Tomates..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
              ]}
              autoFocus
            />

            {suggestions.length > 0 && name.length < 10 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestScroll}>
                {suggestions.slice(0, 6).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setName(s)}
                    style={[styles.suggestChip, { backgroundColor: colors.accentLight, borderColor: colors.accent + "40" }]}
                  >
                    <Text style={[styles.suggestText, { color: colors.accent }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Quantité</Text>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
                  ]}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Unité</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {COMMON_UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setUnit(u)}
                      style={[
                        styles.unitChip,
                        {
                          backgroundColor: unit === u ? colors.primary : colors.secondary,
                          borderColor: unit === u ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 12, color: unit === u ? "#fff" : colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Date de péremption (optionnel)
            </Text>
            <TextInput
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
              ]}
            />
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.addBtn,
              { backgroundColor: name.trim() ? colors.primary : colors.muted },
            ]}
            onPress={handleAdd}
            disabled={!name.trim()}
          >
            <Feather name="plus" size={18} color={name.trim() ? "#fff" : colors.mutedForeground} />
            <Text
              style={[
                styles.addBtnText,
                { color: name.trim() ? "#fff" : colors.mutedForeground },
              ]}
            >
              Ajouter
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  catScroll: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  catLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  suggestScroll: { marginTop: 8, marginBottom: 4 },
  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  suggestText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  row: { flexDirection: "row", gap: 12 },
  halfCol: { flex: 1 },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 20,
  },
  addBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
