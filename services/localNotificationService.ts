import * as Notifications from "expo-notifications";
import {EXPIRING_SOON_WARNING_MS, NotificationService} from "./notifications";

// expo-notifications n'est pas pleinement disponible dans Expo Go (SDK 53+, notamment Android) :
// cet appel peut lever au chargement du module, ce qui ferait planter tout l'import chain en amont
// (MatchesContext -> useMatches -> onglets). Les notifications restent un confort, jamais un chemin critique.
try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });
} catch {
    // Ignoré volontairement — voir le commentaire ci-dessus.
}

const expiringNotificationIds = new Map<string, string>();

async function requestPermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
}

async function notifyYourTurn({matchId, opponentName}: {matchId: string; opponentName: string}): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "C'est ton tour",
            body: `${opponentName} attend ta réponse dans votre défi.`,
            data: {matchId},
        },
        trigger: null,
    });
}

async function notifyMatchFinished({matchId, resultLabel}: {matchId: string; resultLabel: string}): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Ton défi t'attend",
            body: resultLabel,
            data: {matchId},
        },
        trigger: null,
    });
}

async function cancelExpiringSoon(matchId: string): Promise<void> {
    const id = expiringNotificationIds.get(matchId);
    if (!id) return;
    await Notifications.cancelScheduledNotificationAsync(id);
    expiringNotificationIds.delete(matchId);
}

async function scheduleExpiringSoon({matchId, expiresAt}: {matchId: string; expiresAt: number}): Promise<void> {
    const fireAt = expiresAt - EXPIRING_SOON_WARNING_MS;
    if (fireAt <= Date.now()) return;

    await cancelExpiringSoon(matchId);
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: "Il te reste 6 h",
            body: "Réponds avant que ta partie n'expire.",
            data: {matchId},
        },
        trigger: {type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireAt)},
    });
    expiringNotificationIds.set(matchId, id);
}

export const localNotificationService: NotificationService = {
    requestPermission,
    notifyYourTurn,
    notifyMatchFinished,
    scheduleExpiringSoon,
    cancelExpiringSoon,
};
