import {createAudioPlayer, type AudioPlayer} from "expo-audio";
import {isSoundEnabled} from "./preferences";

const SOUND_SOURCES = {
    correct: require("@/assets/sounds/correct.mp3"),
    incorrect: require("@/assets/sounds/incorrect.mp3"),
    victory: require("@/assets/sounds/victory.mp3"),
} as const;

export type SoundName = keyof typeof SOUND_SOURCES;

const players = new Map<SoundName, AudioPlayer>();

function getPlayer(name: SoundName): AudioPlayer {
    let player = players.get(name);
    if (!player) {
        player = createAudioPlayer(SOUND_SOURCES[name]);
        players.set(name, player);
    }
    return player;
}

/** Joue un effet sonore court (bonne/mauvaise réponse, victoire). Best-effort : un son ne doit jamais faire planter l'app (permissions, mode silencieux, module indisponible). */
export function playSound(name: SoundName): void {
    if (!isSoundEnabled()) return;
    try {
        const player = getPlayer(name);
        player.seekTo(0).catch(() => {});
        player.play();
    } catch {
        // Ignoré volontairement — voir le commentaire ci-dessus.
    }
}
