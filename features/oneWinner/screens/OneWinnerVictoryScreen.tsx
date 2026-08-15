import {Text, View} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {useRouter} from "expo-router";
import ShadowCard from "@/components/ShadowCard";
import PressableScale from "@/components/PressableScale";
import {OneWinnerGameSummary} from "@/lib/oneWinnerApi";

export interface OneWinnerVictoryScreenProps {
    game: OneWinnerGameSummary;
    myId: string;
}

const OneWinnerVictoryScreen = ({game, myId}: OneWinnerVictoryScreenProps) => {
    const router = useRouter();
    const winner = game.players.find((player) => player.id === game.winnerId);
    const iWon = game.winnerId === myId;

    const ranked = [...game.players].sort((a, b) => (a.finalRank ?? 99) - (b.finalRank ?? 99));

    return (
        <View className="flex-1 gap-6">
            <View className="items-center gap-3">
                <View className="one-winner-victory-trophy">
                    <Text className="text-[40px]">🏆</Text>
                </View>
                <Text className="solo-hero-title text-center text-plateau-paper">{iWon ? "Vous avez gagné !" : `${winner?.displayName ?? "Un joueur"} a gagné !`}</Text>
                <Text className="solo-hero-subtitle text-center text-plateau-paper/60">Un seul gagnant — partie terminée</Text>
            </View>

            <View className="gap-3">
                {ranked.map((player) => (
                    <View key={player.id} className={clsx("one-winner-standing-row", player.id === game.winnerId && "border-plateau-brass")}>
                        <Text className="one-winner-standing-rank">{player.finalRank ?? "—"}</Text>
                        <Text className="one-winner-standing-name" numberOfLines={1}>
                            {player.displayName}
                        </Text>
                        {player.id === game.winnerId && <Text className="text-[16px]">🏆</Text>}
                    </View>
                ))}
            </View>

            <View className="mt-auto">
                <ShadowCard borderRadius={20} className="solo-cta-button">
                    <PressableScale activeScale={0.98} onPress={() => router.replace("/(tabs)")} accessibilityRole="button">
                        <Text className="solo-cta-text">Retour à l&#39;accueil</Text>
                    </PressableScale>
                </ShadowCard>
            </View>
        </View>
    );
};

export default OneWinnerVictoryScreen;
