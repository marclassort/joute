import {generateId} from "@/lib/utils";
import {generateNickname} from "@/game/nickname";
import {OneWinnerAuth} from "@/lib/oneWinnerApi";

/**
 * Invités fantômes, réservés au développement (npx expo start -c) : permettent de tester l'UI/UX de
 * "UN SEUL GAGNANT" seul, sans avoir à ouvrir 3 autres appareils/comptes. Ce sont de VRAIS invités côté
 * backend (même identité que services/guestIdentity.ts, juste jetable et non persistée sur l'appareil)
 * — voir features/oneWinner/hooks/useDevGhostAutoplay.ts pour la logique qui les fait jouer tout seuls.
 */
export interface GhostGuest {
    auth: Extract<OneWinnerAuth, {kind: "guest"}>;
}

const GHOST_SUFFIX = " 👻";

export function createGhostGuest(): GhostGuest {
    return {
        auth: {kind: "guest", guestId: generateId("guest"), displayName: `${generateNickname()}${GHOST_SUFFIX}`},
    };
}
