"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MotionConfig } from "framer-motion";
import { useLiveAppState } from "@/hooks/useLiveAppState";
import type {
  ApplianceTag,
  AppStatePayload,
  DietaryTag,
  PlanTier,
} from "@/lib/types";

export type ColorSchemePreference = "system" | "light" | "dark";

export interface ActiveCookTimer {
  slug: string;
  recipeTitle: string;
  stepNumber: number;
  stepTitle: string;
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  finished: boolean;
}

export interface DraftBoxState {
  planTier: PlanTier;
  portionsByRecipe: Record<string, number>;
  addons: Record<string, number>;
}

interface AppContextValue {
  state: AppStatePayload | null;
  loading: boolean;
  refresh: () => Promise<void>;
  selectedCondoId: string;
  setSelectedCondoId: (id: string) => void;
  condoPickerOpen: boolean;
  setCondoPickerOpen: (open: boolean) => void;
  appliances: ApplianceTag[];
  toggleAppliance: (tag: ApplianceTag) => void;
  dietary: DietaryTag[];
  toggleDietary: (tag: DietaryTag) => void;
  savedRecipeIds: string[];
  toggleSaveRecipe: (recipeId: string) => void;
  votedRecipeIds: string[];
  voteForRecipe: (recipeId: string) => Promise<void>;
  draftBox: DraftBoxState;
  setPlanTier: (tier: PlanTier) => void;
  setDishPortion: (recipeId: string, delta: number) => void;
  autoFillBox: () => void;
  setAddonQty: (addonId: string, delta: number) => void;
  addRecipeToBox: (recipeId: string) => void;
  resetDraftBox: () => void;
  lastOrderIds: string[];
  registerNewOrderId: (id: string) => void;
  activeTimer: ActiveCookTimer | null;
  startCookTimer: (args: {
    slug: string;
    recipeTitle: string;
    stepNumber: number;
    stepTitle: string;
    seconds: number;
  }) => void;
  toggleCookTimer: () => void;
  adjustCookTimer: (deltaSeconds: number) => void;
  clearCookTimer: () => void;
  colorScheme: ColorSchemePreference;
  setColorScheme: (pref: ColorSchemePreference) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function playTripleChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [0, 0.22, 0.44].forEach((delay, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(idx === 2 ? 1046.5 : 880, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.21);
    });
  } catch {
    // Ignore audio context block
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([120, 80, 120, 80, 220]);
  }
}

export function formatCountdown(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { state, loading, refresh } = useLiveAppState();

  const [selectedCondoId, setSelectedCondoIdState] = useState("condo-geo");
  const [condoPickerOpen, setCondoPickerOpen] = useState(false);
  const [appliances, setAppliances] = useState<ApplianceTag[]>([
    "Rice Cooker",
    "Air Fryer",
    "Single Pan",
  ]);
  const [dietary, setDietary] = useState<DietaryTag[]>(["100% Halal"]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([
    "rec-teriyaki-01",
    "rec-miso-honey-salmon",
  ]);
  const [votedRecipeIds, setVotedRecipeIds] = useState<string[]>([]);
  const [lastOrderIds, setLastOrderIds] = useState<string[]>(["ord-104"]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [colorScheme, setColorSchemeState] =
    useState<ColorSchemePreference>("dark");

  const [draftBox, setDraftBox] = useState<DraftBoxState>({
    planTier: "pro",
    portionsByRecipe: {
      "rec-teriyaki-01": 2,
      "rec-creamy-sambal": 1,
      "rec-black-pepper": 1,
      "rec-lemon-herb": 1,
    },
    addons: {},
  });

  const [activeTimer, setActiveTimer] = useState<ActiveCookTimer | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Hydrate persisted client preferences & sync cross-tab color-scheme
  useEffect(() => {
    const hydrateTimer = setTimeout(() => {
      try {
        const savedCondo = localStorage.getItem("gr_condo_id");
        if (savedCondo) setSelectedCondoIdState(savedCondo);
        const savedApp = localStorage.getItem("gr_appliances");
        if (savedApp) {
          const parsedApp = (JSON.parse(savedApp) as string[]).map((t) =>
            t === "Rice-Cooker" ? "Rice Cooker" : t
          ) as ApplianceTag[];
          setAppliances(parsedApp);
        }
        const savedDiet = localStorage.getItem("gr_dietary");
        if (savedDiet) {
          const parsedDiet = (JSON.parse(savedDiet) as string[]).map((t) =>
            t === "High-Protein" ? "High Protein" : t
          ) as DietaryTag[];
          setDietary(parsedDiet);
        }
        const savedFav = localStorage.getItem("gr_saved_recipes");
        if (savedFav) setSavedRecipeIds(JSON.parse(savedFav));
        const savedVotes = localStorage.getItem("gr_voted_recipes");
        if (savedVotes) setVotedRecipeIds(JSON.parse(savedVotes));
        const storedScheme = localStorage.getItem("color-scheme");
        if (
          storedScheme === "light" ||
          storedScheme === "dark" ||
          storedScheme === "system"
        ) {
          setColorSchemeState(storedScheme);
        }
      } catch {
        // Ignore storage errors
      }
    }, 0);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "color-scheme") {
        const next: ColorSchemePreference =
          e.newValue === "light" ||
          e.newValue === "dark" ||
          e.newValue === "system"
            ? e.newValue
            : "dark";
        setColorSchemeState(next);
        const meta = document.querySelector('meta[name="color-scheme"]');
        if (meta) {
          meta.setAttribute("content", next === "system" ? "light dark" : next);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearTimeout(hydrateTimer);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Global 1s timer loop for Cook-Along & Dynamic Island Live Activity
  useEffect(() => {
    if (!activeTimer || !activeTimer.running) return;
    const interval = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev || !prev.running) return prev;
        if (prev.remainingSeconds <= 1) {
          playTripleChime();
          return { ...prev, remainingSeconds: 0, running: false, finished: true };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer?.running]); // eslint-disable-line react-hooks/exhaustive-deps

  const setColorScheme = useCallback((pref: ColorSchemePreference) => {
    setColorSchemeState(pref);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute("content", pref === "system" ? "light dark" : pref);
    }
    try {
      localStorage.setItem("color-scheme", pref);
    } catch {
      // Ignore
    }
  }, []);

  const setSelectedCondoId = useCallback((id: string) => {
    setSelectedCondoIdState(id);
    try {
      localStorage.setItem("gr_condo_id", id);
    } catch {
      // Ignore
    }
  }, []);

  const toggleAppliance = useCallback((tag: ApplianceTag) => {
    setAppliances((prev) => {
      const next = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      try {
        localStorage.setItem("gr_appliances", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const toggleDietary = useCallback((tag: DietaryTag) => {
    setDietary((prev) => {
      const next = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      try {
        localStorage.setItem("gr_dietary", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const toggleSaveRecipe = useCallback((recipeId: string) => {
    setSavedRecipeIds((prev) => {
      const next = prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId];
      try {
        localStorage.setItem("gr_saved_recipes", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const voteForRecipe = useCallback(
    async (recipeId: string) => {
      if (votedRecipeIds.includes(recipeId)) {
        showToast("Already voted for next week's pool");
        return;
      }
      const res = await fetch("/api/recipes/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId }),
      });
      if (res.ok) {
        const next = [...votedRecipeIds, recipeId];
        setVotedRecipeIds(next);
        try {
          localStorage.setItem("gr_voted_recipes", JSON.stringify(next));
        } catch {
          // Ignore
        }
        showToast("Vote recorded for next week's procurement pool");
        await refresh();
      }
    },
    [votedRecipeIds, refresh, showToast]
  );

  const setPlanTier = useCallback(
    (tier: PlanTier) => {
      const plan = state?.plans.find((p) => p.tier === tier);
      const pooled = (state?.recipes || []).filter((r) => r.is_pooled_this_week);
      if (!plan || pooled.length === 0) {
        setDraftBox((prev) => ({ ...prev, planTier: tier }));
        return;
      }
      // Distribute meals cleanly across the 4 pooled dishes
      const map: Record<string, number> = {};
      pooled.forEach((r) => {
        map[r.id] = 0;
      });
      for (let i = 0; i < plan.meals; i++) {
        const rec = pooled[i % pooled.length];
        map[rec.id] = (map[rec.id] || 0) + 1;
      }
      setDraftBox((prev) => ({
        ...prev,
        planTier: tier,
        portionsByRecipe: map,
      }));
    },
    [state]
  );

  const setDishPortion = useCallback(
    (recipeId: string, delta: number) => {
      setDraftBox((prev) => {
        const plan = state?.plans.find((p) => p.tier === prev.planTier);
        const maxMeals = plan?.meals || 5;
        const currentTotal = Object.values(prev.portionsByRecipe).reduce(
          (s, n) => s + n,
          0
        );
        const cur = prev.portionsByRecipe[recipeId] || 0;
        if (delta > 0 && currentTotal >= maxMeals) {
          showToast(`Your ${plan?.name || "box"} has ${maxMeals} meal slots. Tap minus to swap.`);
          return prev;
        }
        const nextVal = Math.max(0, cur + delta);
        return {
          ...prev,
          portionsByRecipe: { ...prev.portionsByRecipe, [recipeId]: nextVal },
        };
      });
    },
    [state, showToast]
  );

  const autoFillBox = useCallback(() => {
    setPlanTier(draftBox.planTier);
  }, [draftBox.planTier, setPlanTier]);

  const setAddonQty = useCallback((addonId: string, delta: number) => {
    setDraftBox((prev) => {
      const cur = prev.addons[addonId] || 0;
      const next = Math.max(0, Math.min(6, cur + delta));
      return {
        ...prev,
        addons: { ...prev.addons, [addonId]: next },
      };
    });
  }, []);

  const addRecipeToBox = useCallback(
    (recipeId: string) => {
      const recipe = state?.recipes.find((r) => r.id === recipeId);
      setDraftBox((prev) => {
        const plan = state?.plans.find((p) => p.tier === prev.planTier);
        const maxMeals = plan?.meals || 5;
        const nextMap = { ...prev.portionsByRecipe };
        const total = Object.values(nextMap).reduce((s, n) => s + n, 0);

        if (total < maxMeals) {
          nextMap[recipeId] = (nextMap[recipeId] || 0) + 1;
        } else {
          // Swap 1 portion from another dish so 1-tap Add always succeeds smoothly
          const donorKey = Object.keys(nextMap).find(
            (k) => k !== recipeId && (nextMap[k] || 0) > 0
          );
          if (donorKey) {
            nextMap[donorKey] -= 1;
            nextMap[recipeId] = (nextMap[recipeId] || 0) + 1;
          }
        }
        return { ...prev, portionsByRecipe: nextMap };
      });
      showToast(
        recipe ? `Added ${recipe.title} to your Sunday Box` : "Added to your Sunday Box"
      );
    },
    [state, showToast]
  );

  const resetDraftBox = useCallback(() => {
    setPlanTier("pro");
    setDraftBox((prev) => ({ ...prev, addons: {} }));
  }, [setPlanTier]);

  const registerNewOrderId = useCallback((id: string) => {
    setLastOrderIds((prev) => [id, ...prev.filter((x) => x !== id)]);
  }, []);

  const startCookTimer = useCallback(
    (args: {
      slug: string;
      recipeTitle: string;
      stepNumber: number;
      stepTitle: string;
      seconds: number;
    }) => {
      setActiveTimer({
        slug: args.slug,
        recipeTitle: args.recipeTitle,
        stepNumber: args.stepNumber,
        stepTitle: args.stepTitle,
        totalSeconds: args.seconds,
        remainingSeconds: args.seconds,
        running: true,
        finished: false,
      });
    },
    []
  );

  const toggleCookTimer = useCallback(() => {
    setActiveTimer((prev) =>
      prev
        ? {
            ...prev,
            running: prev.remainingSeconds > 0 ? !prev.running : false,
          }
        : null
    );
  }, []);

  const adjustCookTimer = useCallback((deltaSeconds: number) => {
    setActiveTimer((prev) => {
      if (!prev) return null;
      const nextRem = Math.max(0, prev.remainingSeconds + deltaSeconds);
      return {
        ...prev,
        totalSeconds: Math.max(prev.totalSeconds, nextRem),
        remainingSeconds: nextRem,
        finished: nextRem === 0,
      };
    });
  }, []);

  const clearCookTimer = useCallback(() => {
    setActiveTimer(null);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      loading,
      refresh,
      selectedCondoId,
      setSelectedCondoId,
      condoPickerOpen,
      setCondoPickerOpen,
      appliances,
      toggleAppliance,
      dietary,
      toggleDietary,
      savedRecipeIds,
      toggleSaveRecipe,
      votedRecipeIds,
      voteForRecipe,
      draftBox,
      setPlanTier,
      setDishPortion,
      autoFillBox,
      setAddonQty,
      addRecipeToBox,
      resetDraftBox,
      lastOrderIds,
      registerNewOrderId,
      activeTimer,
      startCookTimer,
      toggleCookTimer,
      adjustCookTimer,
      clearCookTimer,
      colorScheme,
      setColorScheme,
      toastMessage,
      showToast,
    }),
    [
      state,
      loading,
      refresh,
      selectedCondoId,
      setSelectedCondoId,
      condoPickerOpen,
      appliances,
      toggleAppliance,
      dietary,
      toggleDietary,
      savedRecipeIds,
      toggleSaveRecipe,
      votedRecipeIds,
      voteForRecipe,
      draftBox,
      setPlanTier,
      setDishPortion,
      autoFillBox,
      setAddonQty,
      addRecipeToBox,
      resetDraftBox,
      lastOrderIds,
      registerNewOrderId,
      activeTimer,
      startCookTimer,
      toggleCookTimer,
      adjustCookTimer,
      clearCookTimer,
      colorScheme,
      setColorScheme,
      toastMessage,
      showToast,
    ]
  );

  return (
    <MotionConfig reducedMotion="user">
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </MotionConfig>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
