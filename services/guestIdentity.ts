import AsyncStorage from "@react-native-async-storage/async-storage";
import {generateId} from "@/lib/utils";

export const ONBOARDING_SEEN_KEY = "joute:onboarding-seen";
const GUEST_ID_KEY = "joute:guest-id";

export async function markOnboardingSeen(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
}

export async function hasSeenOnboarding(): Promise<boolean> {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === "true";
}

export async function getOrCreateGuestId(): Promise<string> {
    const existing = await AsyncStorage.getItem(GUEST_ID_KEY);
    if (existing) return existing;

    const id = generateId("guest");
    await AsyncStorage.setItem(GUEST_ID_KEY, id);
    return id;
}
