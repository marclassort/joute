import {Pressable, ScrollView, Text, View} from "react-native";
import React, {useEffect, useRef} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {createMatch} from "@/game/engine";
import {computeOutcomeForPlayer, computePlayerMatchStats, computeScore} from "@/game/rules";
import {XP_DUEL_WIN_BONUS, XP_PER_CORRECT_DUEL} from "@/game/gamification";
import {localGamificationRepository} from "@/services/localGamificationRepository";
import {generateId} from "@/lib/utils";
import {useMatch} from "../hooks/useMatch";
import {useCurrentPlayer} from "../hooks/useCurrentPlayer";
import {CATEGORY_LABELS} from "../constants";
import MatchHeader from "../components/MatchHeader";
import PlayersScoreRow from "../components/PlayersScoreRow";

const SafeAreaView = styled(RNSafeAreaView);

export interface ResultScreenProps {
    matchId: string;
}

const VERDICT_LABELS: Record<"win" | "loss" | "draw", string> = {
    win: "Tu as gagné",
    loss: "Tu as perdu",
    draw: "Match nul",
};

const formatSeconds = (ms: number): string => `${(ms / 1000).toFixed(1)} s`;

const ResultScreen = ({matchId}: ResultScreenProps) => {
    const {id: myId} = useCurrentPlayer();
    const router = useRouter();
    const {match, isLoading, saveMatch} = useMatch(matchId);
    const hasAwardedRef = useRef(false);

    useEffect(() => {
        if (!match || hasAwardedRef.current) return;
        if (match.status !== "completed" && match.status !== "expired") return;

        const outcome = computeOutcomeForPlayer(match, myId);
        if (outcome === null) return;

        hasAwardedRef.current = true;
        const xp = computeScore(match, myId) * XP_PER_CORRECT_DUEL + (outcome === "win" ? XP_DUEL_WIN_BONUS : 0);
        localGamificationRepository.awardXpForMatch(match.id, xp);
    }, [match, myId]);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <View className="joute-skeleton" />
                <View className="joute-skeleton mt-4 h-40" />
            </SafeAreaView>
        );
    }

    if (!match) {
        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <MatchHeader onBack={() => router.back()} title="Résultat" />
                <Text className="home-empty-state">Cette partie n&#39;existe plus ou a été supprimée.</Text>
            </SafeAreaView>
        );
    }

    const opponent = match.players.find((player) => player.id !== myId) ?? match.players[1];
    const me = match.players.find((player) => player.id === myId) ?? match.players[0];

    const outcome = computeOutcomeForPlayer(match, myId);
    const verdictLabel = outcome === null ? "Partie annulée" : VERDICT_LABELS[outcome];

    const myStats = computePlayerMatchStats(match, myId);
    const opponentStats = computePlayerMatchStats(match, opponent.id);

    const handleRematch = async () => {
        const rematch = createMatch({id: generateId("match"), players: match.players});
        await saveMatch(rematch);
        router.replace(`/joute/${rematch.id}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <MatchHeader onBack={() => router.back()} title="Résultat" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
                <Text className="joute-result-verdict">{verdictLabel}</Text>

                <PlayersScoreRow
                    me={me}
                    opponent={opponent}
                    myScore={computeScore(match, myId)}
                    opponentScore={computeScore(match, opponent.id)}
                />

                <View className="joute-card gap-4">
                    <Text className="settings-card-label">Statistiques</Text>

                    <View className="sub-details">
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Meilleur thème :</Text>
                                <Text className="sub-value" numberOfLines={1}>
                                    {myStats.bestCategory ? CATEGORY_LABELS[myStats.bestCategory] : "—"} / {opponentStats.bestCategory ? CATEGORY_LABELS[opponentStats.bestCategory] : "—"}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Temps de réponse moyen :</Text>
                                <Text className="sub-value" numberOfLines={1}>
                                    {formatSeconds(myStats.averageResponseMs)} / {formatSeconds(opponentStats.averageResponseMs)}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Plus longue série :</Text>
                                <Text className="sub-value" numberOfLines={1}>
                                    {myStats.longestCorrectStreak} / {opponentStats.longestCorrectStreak}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Manches remportées :</Text>
                                <Text className="sub-value" numberOfLines={1}>
                                    {myStats.roundsWon} / {opponentStats.roundsWon}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <Pressable className="joute-new-match-button" onPress={handleRematch} accessibilityRole="button">
                    <Text className="joute-new-match-text">Revanche</Text>
                </Pressable>

                <Pressable
                    className="auth-secondary-button"
                    onPress={() => router.push(`/joute/${match.id}/rounds`)}
                    accessibilityRole="button"
                >
                    <Text className="auth-secondary-button-text">Détail des manches</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ResultScreen;
