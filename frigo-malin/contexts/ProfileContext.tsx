import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { RecipeMode } from "@/constants/recipeData";

export interface UserProfile {
  name: string;
  activeModes: RecipeMode[];
  allergies: string[];
  cookingLevel: "débutant" | "intermédiaire" | "expert";
  servings: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  activeModes: ["anti-gaspillage"],
  allergies: [],
  cookingLevel: "intermédiaire",
  servings: 2,
};

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  toggleMode: (mode: RecipeMode) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

const STORAGE_KEY = "@frigo_malin_profile";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(data) });
        } catch {
          setProfile(DEFAULT_PROFILE);
        }
      }
    });
  }, []);

  const persist = useCallback((p: UserProfile) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setProfile((prev) => {
        const updated = { ...prev, ...updates };
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const toggleMode = useCallback(
    (mode: RecipeMode) => {
      setProfile((prev) => {
        const hasMode = prev.activeModes.includes(mode);
        const activeModes = hasMode
          ? prev.activeModes.filter((m) => m !== mode)
          : [...prev.activeModes, mode];
        const updated = { ...prev, activeModes };
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, toggleMode }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
