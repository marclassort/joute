export const EXPIRING_SOON_WARNING_MS = 6 * 60 * 60 * 1000;

export interface NotificationService {
    requestPermission(): Promise<boolean>;
    notifyYourTurn(params: {matchId: string; opponentName: string}): Promise<void>;
    notifyMatchFinished(params: {matchId: string; resultLabel: string}): Promise<void>;
    /** Programme un rappel local à expiresAt - 6h ; n'a aucun effet si ce moment est déjà passé. */
    scheduleExpiringSoon(params: {matchId: string; expiresAt: number}): Promise<void>;
    cancelExpiringSoon(matchId: string): Promise<void>;
}
