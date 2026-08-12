import {Pressable, ScrollView, Text, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {createMatch} from "@/game/engine";
import {computeOutcomeForPlayer, computePlayerMatchStats, computeScore} from "@/game/rules";
import {XP_DUEL_WIN_BONUS, XP_PER_CORRECT_DUEL, computeLevel} from "@/game/gamification";
import {localGamificationRepository} from "@/services/localGamificationRepository";
import {generateId} from "@/lib/utils";
import {plateauColors} from "@/constants/theme";
import HardShadowCard from "@/features/joute/components/HardShadowCard";
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

const VERDICT_COLORS: Record<"win" | "loss" | "draw", string> = {
    win: plateauColors.lime,
    loss: plateauColors.pink,
    draw: plateauColors.cream,
};

const formatSeconds = (ms: number): string => `${(ms / 1000).toFixed(1)} s`;

const ResultScreen = ({matchId}: ResultScreenProps) => {
    const {id: myId} = useCurrentPlayer();
    const router = useRouter();
    const {match, isLoading, saveMatch} = useMatch(matchId);
    const hasAwardedRef = useRef(false);
    const [awardedXp, setAwardedXp] = useState<number | null>(null);
    const [level, setLevel] = useState<number | null>(null);

    useEffect(() => {
        if (!match || hasAwardedRef.current) return;
        if (match.status !== "completed" && match.status !== "expired") return;

        const outcome = computeOutcomeForPlayer(match, myId);
        if (outcome === null) return;

        hasAwardedRef.current = true;
        const xp = computeScore(match, myId) * XP_PER_CORRECT_DUEL + (outcome === "win" ? XP_DUEL_WIN_BONUS : 0);

        localGamificationRepository.get().then((before) => {
            const alreadyRewarded = before.rewardedMatchIds.includes(match.id);
            localGamificationRepository.awardXpForMatch(match.id, xp).then((after) => {
                setLevel(computeLevel(after.totalXp));
                setAwardedXp(alreadyRewarded ? null : xp);
            });
        });
    }, [match, myId]);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <View className="duel-skeleton" />
                <View className="duel-skeleton mt-4 h-40" />
            </SafeAreaView>
        );
    }

    if (!match) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <MatchHeader onBack={() => router.back()} title="Résultat" />
                <Text className="duel-empty-state">Cette partie n&#39;existe plus ou a été supprimée.</Text>
            </SafeAreaView>
        );
    }

    const opponent = match.players.find((player) => player.id !== myId) ?? match.players[1];
    const me = match.players.find((player) => player.id === myId) ?? match.players[0];

    const outcome = computeOutcomeForPlayer(match, myId);
    const verdictLabel = outcome === null ? "Partie annulée" : VERDICT_LABELS[outcome];
    const verdictColor = outcome === null ? plateauColors.cream : VERDICT_COLORS[outcome];

    const myStats = computePlayerMatchStats(match, myId);
    const opponentStats = computePlayerMatchStats(match, opponent.id);

    const handleRematch = async () => {
        const rematch = createMatch({id: generateId("match"), players: match.players});
        await saveMatch(rematch);
        router.replace(`/joute/${rematch.id}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <MatchHeader onBack={() => router.back()} title="Résultat" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
                <Text className="duel-result-verdict" style={{color: verdictColor}}>
                    {verdictLabel}
                </Text>

                {level !== null && (
                    <View className="duel-result-pills-row">
                        {awardedXp !== null && (
                            <View className="hub-pill bg-plateau-gold">
                                <Text className="hub-pill-text">+{awardedXp} XP</Text>
                            </View>
                        )}
                        <View className="hub-pill bg-plateau-violet">
                            <Text className="hub-pill-text text-plateau-cream">Niv. {level}</Text>
                        </View>
                    </View>
                )}

                <PlayersScoreRow
                    me={me}
                    opponent={opponent}
                    myScore={computeScore(match, myId)}
                    opponentScore={computeScore(match, opponent.id)}
                />

                <View className="duel-result-stats-card">
                    <Text className="duel-result-stats-label">Statistiques</Text>

                    <View className="duel-result-stat-row">
                        <Text className="duel-result-stat-label">Meilleur thème</Text>
                        <Text className="duel-result-stat-value" numberOfLines={1}>
                            {myStats.bestCategory ? CATEGORY_LABELS[myStats.bestCategory] : "—"} / {opponentStats.bestCategory ? CATEGORY_LABELS[opponentStats.bestCategory] : "—"}
                        </Text>
                    </View>
                    <View className="duel-result-stat-row">
                        <Text className="duel-result-stat-label">Temps de réponse moyen</Text>
                        <Text className="duel-result-stat-value" numberOfLines={1}>
                            {formatSeconds(myStats.averageResponseMs)} / {formatSeconds(opponentStats.averageResponseMs)}
                        </Text>
                    </View>
                    <View className="duel-result-stat-row">
                        <Text className="duel-result-stat-label">Plus longue série</Text>
                        <Text className="duel-result-stat-value" numberOfLines={1}>
                            {myStats.longestCorrectStreak} / {opponentStats.longestCorrectStreak}
                        </Text>
                    </View>
                    <View className="duel-result-stat-row">
                        <Text className="duel-result-stat-label">Manches remportées</Text>
                        <Text className="duel-result-stat-value" numberOfLines={1}>
                            {myStats.roundsWon} / {opponentStats.roundsWon}
                        </Text>
                    </View>
                </View>

                <HardShadowCard borderRadius={20} offsetY={5} className="solo-cta-button">
                    <Pressable onPress={handleRematch} accessibilityRole="button">
                        <Text className="solo-cta-text">Revanche</Text>
                    </Pressable>
                </HardShadowCard>

                <Pressable
                    className="duel-lobby-secondary-button"
                    onPress={() => router.push(`/joute/${match.id}/rounds`)}
                    accessibilityRole="button"
                >
                    <Text className="duel-lobby-secondary-text">Détail des manches</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ResultScreen;
