import {Image, Pressable, ScrollView, Text, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {createMatch} from "@/game/engine";
import {computeOutcomeForPlayer, computePlayerMatchStats, computeScore} from "@/game/rules";
import {XP_DUEL_WIN_BONUS, XP_PER_CORRECT_DUEL, computeLevel} from "@/game/gamification";
import {localGamificationRepository} from "@/services/localGamificationRepository";
import {generateId} from "@/lib/utils";
import {playSound} from "@/lib/sounds";
import {plateauColors} from "@/constants/theme";
import {useGamification} from "@/hooks/useGamification";
import InkPattern from "@/components/InkPattern";
import {useMatch} from "../hooks/useMatch";
import {useCurrentPlayer} from "../hooks/useCurrentPlayer";
import {CATEGORY_LABELS} from "../constants";
import MatchHeader from "../components/MatchHeader";

const SafeAreaView = styled(RNSafeAreaView);

const RESULT_KICKER: Record<"win" | "loss" | "draw", string> = {
    win: "Manche remportée",
    loss: "Manche perdue",
    draw: "Manche nulle",
};

const RESULT_TITLE: Record<"win" | "loss" | "draw", string> = {
    win: "Victoire !",
    loss: "Presque…",
    draw: "Match nul",
};

const formatSeconds = (ms: number): string => `${(ms / 1000).toFixed(1)} s`;

const ResultScreen = ({matchId}: {matchId: string}) => {
    const {id: myId} = useCurrentPlayer();
    const router = useRouter();
    const {match, isLoading, saveMatch} = useMatch(matchId);
    const {currentStreak} = useGamification();
    const hasAwardedRef = useRef(false);
    const [awardedXp, setAwardedXp] = useState<number | null>(null);
    const [level, setLevel] = useState<number | null>(null);

    useEffect(() => {
        if (!match || hasAwardedRef.current) return;
        if (match.status !== "completed" && match.status !== "expired") return;

        const outcome = computeOutcomeForPlayer(match, myId);
        if (outcome === null) return;

        hasAwardedRef.current = true;
        if (outcome === "win") playSound("victory");
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
    const kicker = outcome === null ? "Partie annulée" : RESULT_KICKER[outcome];
    const title = outcome === null ? "Partie annulée" : RESULT_TITLE[outcome];

    const myStats = computePlayerMatchStats(match, myId);
    const opponentStats = computePlayerMatchStats(match, opponent.id);

    const handleRematch = async () => {
        const rematch = createMatch({id: generateId("match"), players: match.players});
        await saveMatch(rematch);
        router.replace(`/joute/${rematch.id}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <View className="relative flex-1 overflow-hidden">
                <InkPattern />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="relative gap-4 pb-10">
                    <View className="duel-result-kicker-row">
                        <Text className="text-eyebrow text-plateau-teal">{kicker}</Text>
                        <Text className="text-victory text-plateau-paper">{title}</Text>
                    </View>

                    <View className="duel-result-score-card">
                        <View className="duel-result-player">
                            {me.avatarUrl ? (
                                <Image source={{uri: me.avatarUrl}} className="duel-result-player-avatar" />
                            ) : (
                                <View className="duel-result-player-avatar" style={{backgroundColor: plateauColors.teal}} />
                            )}
                            <Text className="duel-result-player-name">Toi</Text>
                        </View>
                        <Text className="duel-result-score">
                            {computeScore(match, myId)}–{computeScore(match, opponent.id)}
                        </Text>
                        <View className="duel-result-player">
                            {opponent.avatarUrl ? (
                                <Image source={{uri: opponent.avatarUrl}} className="duel-result-player-avatar" />
                            ) : (
                                <View className="duel-result-player-avatar" style={{backgroundColor: plateauColors.iris}} />
                            )}
                            <Text className="duel-result-player-name text-plateau-paper/70" numberOfLines={1}>
                                {opponent.displayName}
                            </Text>
                        </View>
                    </View>

                    {(awardedXp !== null || currentStreak > 0) && (
                        <View className="duel-result-chip-row">
                            {awardedXp !== null && (
                                <View className="duel-result-chip bg-plateau-iris">
                                    <Text className="duel-result-chip-label text-plateau-paper/75">XP{level !== null ? ` · Niv. ${level}` : ""}</Text>
                                    <Text className="duel-result-chip-value text-plateau-paper">+{awardedXp}</Text>
                                </View>
                            )}
                            {currentStreak > 0 && (
                                <View className="duel-result-chip bg-plateau-brass">
                                    <Text className="duel-result-chip-label text-plateau-ink/60">Série</Text>
                                    <Text className="duel-result-chip-value text-plateau-ink">{currentStreak} j</Text>
                                </View>
                            )}
                        </View>
                    )}

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

                    <Pressable className="duel-result-cta" onPress={handleRematch} accessibilityRole="button">
                        <Text className="duel-result-cta-text">Revanche immédiate</Text>
                    </Pressable>

                    <View className="duel-result-secondary-row">
                        <Pressable className="duel-result-secondary-button" onPress={() => router.push("/leaderboard")} accessibilityRole="button">
                            <Text className="duel-result-secondary-text">Classement</Text>
                        </Pressable>
                        <Pressable className="duel-result-secondary-button" onPress={() => router.replace("/(tabs)")} accessibilityRole="button">
                            <Text className="duel-result-secondary-text">Accueil</Text>
                        </Pressable>
                    </View>

                    <Pressable
                        className="duel-lobby-secondary-button"
                        onPress={() => router.push(`/joute/${match.id}/rounds`)}
                        accessibilityRole="button"
                    >
                        <Text className="duel-lobby-secondary-text">Détail des manches</Text>
                    </Pressable>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default ResultScreen;
