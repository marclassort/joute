import AsyncStorage from "@react-native-async-storage/async-storage";
import {generateId} from "@/lib/utils";
import {generateNickname} from "@/game/nickname";

export const ONBOARDING_SEEN_KEY = "joute:onboarding-seen";
const GUEST_ID_KEY = "joute:guest-id";
const GUEST_NAME_KEY = "joute:guest-name";
const NEEDS_PROFILE_SETUP_KEY = "joute:needs-profile-setup";

export async function markOnboardingSeen(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
}

export async function hasSeenOnboarding(): Promise<boolean> {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === "true";
}

/** Posé juste avant de finaliser une inscription, pour que (auth)/_layout envoie vers le tunnel
 * pseudo/avatar/photo au lieu du hub dès que Clerk bascule isSignedIn à true. */
export async function markNeedsProfileSetup(): Promise<void> {
    await AsyncStorage.setItem(NEEDS_PROFILE_SETUP_KEY, "true");
}

export async function clearNeedsProfileSetup(): Promise<void> {
    await AsyncStorage.removeItem(NEEDS_PROFILE_SETUP_KEY);
}

export async function needsProfileSetup(): Promise<boolean> {
    return (await AsyncStorage.getItem(NEEDS_PROFILE_SETUP_KEY)) === "true";
}

export async function getOrCreateGuestId(): Promise<string> {
    const existing = await AsyncStorage.getItem(GUEST_ID_KEY);
    if (existing) return existing;

    const id = generateId("guest");
    await AsyncStorage.setItem(GUEST_ID_KEY, id);
    return id;
}

/** Pseudo affiché aux autres joueurs en multijoueur temps réel (ex. "UN SEUL GAGNANT") — un invité
 * "Invité" tout court serait indistinguable des autres invités de la même partie. */
export async function getOrCreateGuestName(): Promise<string> {
    const existing = await AsyncStorage.getItem(GUEST_NAME_KEY);
    if (existing) return existing;

    const name = generateNickname();
    await AsyncStorage.setItem(GUEST_NAME_KEY, name);
    return name;
}
