import {Text, View} from "react-native";
import React from "react";
import {stageRulesFor} from "@/game/oneWinnerConfig";
import {OneWinnerGameSummary} from "@/lib/oneWinnerApi";
import {EPREUVE_LABELS, STAGE_TITLES} from "../constants";

export interface OneWinnerIntroStageScreenProps {
    game: OneWinnerGameSummary;
}

const OneWinnerIntroStageScreen = ({game}: OneWinnerIntroStageScreenProps) => {
    const epreuves = stageRulesFor(game.stageId).epreuves;
    const remaining = game.players.filter((player) => !player.isEliminated).length;

    return (
        <View className="flex-1 items-center justify-center gap-6 px-2">
            <Text className="text-eyebrow text-plateau-paper/50">{remaining} joueurs en lice</Text>
            <Text className="solo-hero-title text-center text-plateau-paper">{STAGE_TITLES[game.stageId]}</Text>

            <View className="w-full gap-3">
                {epreuves.map((kind) => (
                    <View key={kind} className="duel-category-card">
                        <Text className="duel-category-icon">{EPREUVE_LABELS[kind].icon}</Text>
                        <Text className="duel-category-label">{EPREUVE_LABELS[kind].label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default OneWinnerIntroStageScreen;
