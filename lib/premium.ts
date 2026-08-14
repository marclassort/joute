import {Platform} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "joute:premium";

export type PremiumPlan = "monthly" | "annual";

export interface PremiumState {
    isPremium: boolean;
    plan: PremiumPlan;
}

let cache: PremiumState = {isPremium: false, plan: "annual"};
let loadPromise: Promise<PremiumState> | null = null;

async function load(): Promise<PremiumState> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) cache = {...cache, ...(JSON.parse(raw) as Partial<PremiumState>)};
    return cache;
}

// Uniquement côté client : AsyncStorage (impl. web) accède à window, absent lors du rendu SSR d'expo-router sur Node.
if (typeof window !== "undefined" || Platform.OS !== "web") {
    loadPromise = load();
}

async function persist(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function isPremiumActive(): boolean {
    return cache.isPremium;
}

export async function getPremiumState(): Promise<PremiumState> {
    return loadPromise ?? load();
}

export async function setPremiumPlan(plan: PremiumPlan): Promise<PremiumState> {
    cache = {...cache, plan};
    await persist();
    return cache;
}

/** Simule l'activation d'un abonnement — aucun paiement réel, pas d'IAP branché (voir AGENTS.md : pas de nouvelle librairie sans accord). */
export async function subscribeToPremium(): Promise<PremiumState> {
    cache = {...cache, isPremium: true};
    await persist();
    return cache;
}
