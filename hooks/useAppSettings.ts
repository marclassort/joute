import {useCallback, useEffect, useState} from "react";
import {getPreferences, Preferences, setHapticsEnabled, setSoundEnabled} from "@/lib/preferences";

const DEFAULT_PREFERENCES: Preferences = {soundEnabled: true, hapticsEnabled: true};

/** Préférences sons/vibrations, persistées localement (voir lib/preferences.ts). */
export function useAppSettings() {
    const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

    useEffect(() => {
        getPreferences().then(setPreferences);
    }, []);

    const toggleSound = useCallback(() => {
        setPreferences((current) => {
            const next = !current.soundEnabled;
            setSoundEnabled(next);
            return {...current, soundEnabled: next};
        });
    }, []);

    const toggleHaptics = useCallback(() => {
        setPreferences((current) => {
            const next = !current.hapticsEnabled;
            setHapticsEnabled(next);
            return {...current, hapticsEnabled: next};
        });
    }, []);

    return {...preferences, toggleSound, toggleHaptics};
}
