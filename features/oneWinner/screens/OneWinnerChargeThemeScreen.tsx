import {Text, View} from "react-native";
import React, {useState} from "react";
import PressableScale from "@/components/PressableScale";
import {ALL_OPEN_QUESTIONS, OPEN_QUESTION_THEMES} from "@/data/openQuestions";
import {OneWinnerGameSummary} from "@/lib/oneWinnerApi";

export interface OneWinnerChargeThemeScreenProps {
    game: OneWinnerGameSummary;
    myId: string;
    onChooseTheme: (theme: string) => Promise<void>;
}

const THEME_ICONS: Record<string, string> = {
    Botanique: "🌿",
    "Années disco": "🪩",
    "Mythologie grecque": "🏛️",
};

const OneWinnerChargeThemeScreen = ({game, myId, onChooseTheme}: OneWinnerChargeThemeScreenProps) => {
    const [isChoosing, setIsChoosing] = useState(false);
    const myTheme = game.players.find((player) => player.id === myId)?.chargeTheme ?? null;

    const handleChoose = async (theme: string) => {
        if (myTheme || isChoosing) return;
        setIsChoosing(true);
        try {
            await onChooseTheme(theme);
        } finally {
            setIsChoosing(false);
        }
    };

    return (
        <View className="flex-1 gap-4">
            <View className="gap-1 rounded-[22px] border border-plateau-iris/40 bg-plateau-iris/[0.14] p-4">
                <Text className="text-eyebrow text-plateau-iris">Manche 2 · La Charge</Text>
                <Text className="one-winner-hero-title">Choisis ton thème</Text>
                <Text className="one-winner-hero-subtitle">
                    60 secondes, vos séries tournent en parallèle. 50 points par bonne réponse, multipliés par ta série.
                </Text>
            </View>

            <View className="flex-1 gap-[9px]">
                {OPEN_QUESTION_THEMES.map((theme) => {
                    const selected = myTheme === theme;
                    const count = ALL_OPEN_QUESTIONS.filter((question) => question.theme === theme).length;
                    return (
                        <PressableScale
                            key={theme}
                            activeScale={0.98}
                            className={selected ? "one-winner-charge-theme-card one-winner-charge-theme-card-selected" : "one-winner-charge-theme-card"}
                            onPress={() => handleChoose(theme)}
                            disabled={!!myTheme}
                            accessibilityRole="button"
                        >
                            <View className="one-winner-charge-theme-icon">
                                <Text className="text-xl">{THEME_ICONS[theme] ?? "❓"}</Text>
                            </View>
                            <View className="flex-1 gap-[2px]">
                                <Text className={selected ? "one-winner-charge-theme-label one-winner-charge-theme-label-selected" : "one-winner-charge-theme-label"}>
                                    {theme}
                                </Text>
                                <Text className={selected ? "one-winner-charge-theme-meta one-winner-charge-theme-meta-selected" : "one-winner-charge-theme-meta"}>
                                    {count} questions en réserve
                                </Text>
                            </View>
                            {selected && <Text className="text-base text-plateau-ink">✓</Text>}
                        </PressableScale>
                    );
                })}
            </View>

            <Text className="one-winner-hero-subtitle text-center">
                {myTheme ? "En attente des autres joueurs…" : "Choisis un thème pour continuer"}
            </Text>
        </View>
    );
};

export default OneWinnerChargeThemeScreen;
