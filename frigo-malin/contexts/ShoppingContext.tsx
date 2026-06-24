import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
  addedAt: string;
}

interface ShoppingContextType {
  items: ShoppingItem[];
  addItem: (name: string, quantity?: string) => void;
  toggleItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearChecked: () => void;
  addFromRecipe: (ingredients: { name: string; quantity: string }[]) => void;
}

const ShoppingContext = createContext<ShoppingContextType | null>(null);

const STORAGE_KEY = "@frigo_malin_shopping";

export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setItems(JSON.parse(data));
        } catch {
          setItems([]);
        }
      }
    });
  }, []);

  const persist = useCallback((newItems: ShoppingItem[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  }, []);

  const addItem = useCallback(
    (name: string, quantity = "1") => {
      const item: ShoppingItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        name,
        quantity,
        checked: false,
        addedAt: new Date().toISOString(),
      };
      setItems((prev) => {
        const updated = [item, ...prev];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const toggleItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const updated = prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const clearChecked = useCallback(() => {
    setItems((prev) => {
      const updated = prev.filter((i) => !i.checked);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const addFromRecipe = useCallback(
    (ingredients: { name: string; quantity: string }[]) => {
      setItems((prev) => {
        const newItems = ingredients.map((ing) => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7) + Math.random(),
          name: ing.name,
          quantity: ing.quantity,
          checked: false,
          addedAt: new Date().toISOString(),
        }));
        const updated = [...prev, ...newItems];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  return (
    <ShoppingContext.Provider
      value={{ items, addItem, toggleItem, removeItem, clearChecked, addFromRecipe }}
    >
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error("useShopping must be used inside ShoppingProvider");
  return ctx;
}
