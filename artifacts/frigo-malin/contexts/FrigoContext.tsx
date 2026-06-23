import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { IngredientCategory } from "@/constants/recipeData";

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: IngredientCategory;
  expiryDate?: string;
  addedAt: string;
}

interface FrigoContextType {
  ingredients: Ingredient[];
  addIngredient: (ingredient: Omit<Ingredient, "id" | "addedAt">) => void;
  removeIngredient: (id: string) => void;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  isLoading: boolean;
}

const FrigoContext = createContext<FrigoContextType | null>(null);

const STORAGE_KEY = "@frigo_malin_ingredients";

export function FrigoProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setIngredients(JSON.parse(data));
        } catch {
          setIngredients([]);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback((items: Ingredient[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const addIngredient = useCallback(
    (ingredient: Omit<Ingredient, "id" | "addedAt">) => {
      const newIngredient: Ingredient = {
        ...ingredient,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        addedAt: new Date().toISOString(),
      };
      setIngredients((prev) => {
        const updated = [newIngredient, ...prev];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const removeIngredient = useCallback(
    (id: string) => {
      setIngredients((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const updateIngredient = useCallback(
    (id: string, updates: Partial<Ingredient>) => {
      setIngredients((prev) => {
        const updated = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  return (
    <FrigoContext.Provider
      value={{ ingredients, addIngredient, removeIngredient, updateIngredient, isLoading }}
    >
      {children}
    </FrigoContext.Provider>
  );
}

export function useFrigo() {
  const ctx = useContext(FrigoContext);
  if (!ctx) throw new Error("useFrigo must be used inside FrigoProvider");
  return ctx;
}
