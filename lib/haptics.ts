import * as Haptics from "expo-haptics";
import {isHapticsEnabled} from "./preferences";

export function impactLight(): void {
    if (!isHapticsEnabled()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function impactMedium(): void {
    if (!isHapticsEnabled()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function notifySuccess(): void {
    if (!isHapticsEnabled()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function notifyError(): void {
    if (!isHapticsEnabled()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
