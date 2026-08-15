import {Text, View} from "react-native";
import React from "react";
import {OneWinnerGameSummary} from "@/lib/oneWinnerApi";

export interface OneWinnerClassementScreenProps {
    game: OneWinnerGameSummary;
}

const OneWinnerClassementScreen = ({game}: OneWinnerClassementScreenProps) => (
    <View className="flex-1 gap-4">
        <Text className="solo-hero-title text-center text-plateau-paper">Classement</Text>
        <View className="mt-2 gap-3">
            {game.liveStandings.map((standing) => {
                const player = game.players.find((entry) => entry.id === standing.playerId);
                if (!player) return null;
                return (
                    <View key={player.id} className="one-winner-standing-row">
                        <Text className="one-winner-standing-rank">{standing.rank}</Text>
                        <Text className="one-winner-standing-name" numberOfLines={1}>
                            {player.displayName}
                        </Text>
                        <Text className="one-winner-standing-score">{standing.score}</Text>
                    </View>
                );
            })}
        </View>
    </View>
);

export default OneWinnerClassementScreen;
