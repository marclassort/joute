import {EXPIRING_SOON_WARNING_MS, NotificationService} from "./notifications";

// expo-notifications peut lever dès son chargement dans Expo Go (SDK 53+, notamment Android) — pas
// seulement au moment d'appeler une de ses méthodes. Un `import` statique s'exécute avant tout code,
// y compris un try/catch placé après lui : impossible de s'en protéger avec la syntaxe `import`.
// On charge donc le module via require(), qu'on peut envelopper dans un try/catch. Les notifications
// restent un confort, jamais un chemin critique — chaque fonction ci-dessous tolère un module absent.
let Notifications: typeof import("expo-notifications") | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require("expo-notifications");
    Notifications?.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });
} catch {
    Notifications = null;
}

const expiringNotificationIds = new Map<string, string>();

async function requestPermission(): Promise<boolean> {
    if (!Notifications) return false;
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
}

async function notifyYourTurn({matchId, opponentName}: {matchId: string; opponentName: string}): Promise<void> {
    if (!Notifications) return;
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
    if (!Notifications) return;
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
    if (!Notifications) return;
    const id = expiringNotificationIds.get(matchId);
    if (!id) return;
    await Notifications.cancelScheduledNotificationAsync(id);
    expiringNotificationIds.delete(matchId);
}

async function scheduleExpiringSoon({matchId, expiresAt}: {matchId: string; expiresAt: number}): Promise<void> {
    if (!Notifications) return;
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
