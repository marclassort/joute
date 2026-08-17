import {Text, View} from "react-native";
import React from "react";
import {OneWinnerGameSummary} from "@/lib/oneWinnerApi";
import {ROUND_LABELS} from "../constants";

export interface OneWinnerIntroStageScreenProps {
    game: OneWinnerGameSummary;
}

const OneWinnerIntroStageScreen = ({game}: OneWinnerIntroStageScreenProps) => {
    const round = ROUND_LABELS[game.roundId];
    const remaining = game.players.filter((player) => !player.isEliminated).length;

    return (
        <View className="flex-1 items-center justify-center gap-6 px-2">
            <Text className="text-eyebrow text-plateau-paper/50">{remaining} joueurs en lice</Text>
            <Text className="one-winner-hero-title text-center">{round.title}</Text>

            <View className="w-full gap-2">
                {round.chips.map((chip) => (
                    <View key={chip} className="duel-category-card">
                        <Text className="duel-category-label">{chip}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default OneWinnerIntroStageScreen;
