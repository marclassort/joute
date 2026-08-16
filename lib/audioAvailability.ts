import {requireOptionalNativeModule} from "expo-modules-core";

/**
 * Vrai si le module natif ExpoAudio est enregistré sur ce build (absent de certains builds Expo Go).
 * À vérifier AVANT tout import de "expo-audio" : évaluer ce module quand le natif est absent lance de
 * façon synchrone et incontournable (même un `import()` dynamique dans un try/catch ne le rattrape pas
 * de façon fiable sous rechargement à chaud) — mieux vaut ne jamais l'importer que d'essayer de
 * rattraper l'échec après coup.
 */
export function isAudioModuleAvailable(): boolean {
    try {
        return requireOptionalNativeModule("ExpoAudio") !== null;
    } catch {
        return false;
    }
}
