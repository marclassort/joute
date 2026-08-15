import {Text, View} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {OneWinnerGameSummary} from "@/lib/oneWinnerApi";

export interface OneWinnerEliminationScreenProps {
    game: OneWinnerGameSummary;
}

const OneWinnerEliminationScreen = ({game}: OneWinnerEliminationScreenProps) => {
    const elimination = game.latestElimination;
    const eliminatedIds = new Set(elimination?.eliminatedPlayerIds ?? []);
    const standings = elimination?.standings ?? game.liveStandings;

    return (
        <View className="flex-1 gap-4">
            <Text className="text-eyebrow text-center text-plateau-rose">Élimination</Text>
            <Text className="solo-hero-title text-center text-plateau-paper">
                {eliminatedIds.size > 1 ? "Ils quittent l'aventure" : "Il quitte l'aventure"}
            </Text>

            <View className="mt-2 gap-3">
                {standings.map((standing) => {
                    const player = game.players.find((entry) => entry.id === standing.playerId);
                    if (!player) return null;
                    const isEliminated = eliminatedIds.has(player.id);
                    return (
                        <View key={player.id} className={clsx("one-winner-standing-row", isEliminated && "one-winner-standing-eliminated")}>
                            <Text className="one-winner-standing-rank">{standing.rank}</Text>
                            <Text className="one-winner-standing-name" numberOfLines={1}>
                                {player.displayName}
                            </Text>
                            <Text className="one-winner-standing-score">{standing.score}</Text>
                            {isEliminated && (
                                <View className="one-winner-elimination-badge">
                                    <Text className="one-winner-elimination-badge-text">ÉLIMINÉ</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

export default OneWinnerEliminationScreen;
