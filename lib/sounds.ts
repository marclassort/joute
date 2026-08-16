import {isSoundEnabled} from "./preferences";
import {isAudioModuleAvailable} from "./audioAvailability";

const SOUND_SOURCES = {
    correct: require("@/assets/sounds/correct.mp3"),
    incorrect: require("@/assets/sounds/incorrect.mp3"),
    victory: require("@/assets/sounds/victory.mp3"),
} as const;

export type SoundName = keyof typeof SOUND_SOURCES;

type ExpoAudioModule = typeof import("expo-audio");
type AudioPlayer = import("expo-audio").AudioPlayer;

// Chargé paresseusement, une seule fois. isAudioModuleAvailable() est vérifié AVANT tout import de
// "expo-audio" : évaluer ce module quand le natif est absent (certains builds Expo Go) lance de façon
// synchrone et incontournable, y compris à travers un import() dynamique — voir lib/audioAvailability.ts.
let modulePromise: Promise<ExpoAudioModule | null> | null = null;
function loadExpoAudio(): Promise<ExpoAudioModule | null> {
    if (!modulePromise) {
        modulePromise = isAudioModuleAvailable() ? import("expo-audio").catch(() => null) : Promise.resolve(null);
    }
    return modulePromise;
}

const players = new Map<SoundName, AudioPlayer>();

async function getPlayer(name: SoundName): Promise<AudioPlayer | null> {
    const expoAudio = await loadExpoAudio();
    if (!expoAudio) return null;

    let player = players.get(name);
    if (!player) {
        player = expoAudio.createAudioPlayer(SOUND_SOURCES[name]);
        players.set(name, player);
    }
    return player;
}

/** Joue un effet sonore court (bonne/mauvaise réponse, victoire). Best-effort : un son ne doit jamais faire planter l'app (permissions, mode silencieux, module indisponible). */
export function playSound(name: SoundName): void {
    if (!isSoundEnabled()) return;
    getPlayer(name)
        .then((player) => {
            if (!player) return;
            player.seekTo(0).catch(() => {});
            player.play();
        })
        .catch(() => {
            // Ignoré volontairement — voir le commentaire ci-dessus.
        });
}
