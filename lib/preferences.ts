import {Platform} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "joute:preferences";

export interface Preferences {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
}

let cache: Preferences = {soundEnabled: true, hapticsEnabled: true};
let loadPromise: Promise<Preferences> | null = null;

async function load(): Promise<Preferences> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) cache = {...cache, ...(JSON.parse(raw) as Partial<Preferences>)};
    return cache;
}

// Charge les préférences dès l'import du module — best-effort, ne bloque jamais le rendu (voir isSoundEnabled/isHapticsEnabled).
// Uniquement côté client : AsyncStorage (impl. web) accède à window, absent lors du rendu SSR d'expo-router sur Node.
if (typeof window !== "undefined" || Platform.OS !== "web") {
    loadPromise = load();
}

async function persist(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

/** Valeur synchrone la plus fraîche disponible — true tant que les préférences n'ont pas fini de charger, pour ne jamais couper le son au tout premier lancement. */
export function isSoundEnabled(): boolean {
    return cache.soundEnabled;
}

export function isHapticsEnabled(): boolean {
    return cache.hapticsEnabled;
}

export async function getPreferences(): Promise<Preferences> {
    return loadPromise ?? load();
}

export async function setSoundEnabled(value: boolean): Promise<Preferences> {
    cache = {...cache, soundEnabled: value};
    await persist();
    return cache;
}

export async function setHapticsEnabled(value: boolean): Promise<Preferences> {
    cache = {...cache, hapticsEnabled: value};
    await persist();
    return cache;
}
