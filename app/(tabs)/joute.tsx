import {Image, Pressable, ScrollView, Text, View} from "react-native";
import React, {useMemo} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import ListHeading from "@/components/ListHeading";
import {useMatches} from "@/features/joute/hooks/useMatches";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {computeMatchStats, computeScore} from "@/game/rules";
import {WINNING_SCORE} from "@/game/types";
import {computeLevel} from "@/game/gamification";
import {formatTimeRemaining} from "@/lib/utils";
import {plateauColors} from "@/constants/theme";
import {useGamification} from "@/hooks/useGamification";
import MatchCard from "@/features/joute/components/MatchCard";
import HardShadowCard from "@/features/joute/components/HardShadowCard";

const SafeAreaView = styled(RNSafeAreaView);

const Joute = () => {
    const {id: myId, displayName, avatarUrl: avatarUri} = useCurrentPlayer();
    const router = useRouter();
    const {matches} = useMatches();
    const {totalXp, currentStreak: dailyStreak} = useGamification();

    const stats = useMemo(() => computeMatchStats(matches, myId), [matches, myId]);
    const level = computeLevel(totalXp);

    const toPlay = useMemo(
        () =>
            matches
                .filter((match) => match.status === "active" && match.currentTurnPlayerId === myId)
                .sort((a, b) => a.expiresAt - b.expiresAt),
        [matches, myId],
    );

    const waiting = useMemo(
        () =>
            matches
                .filter((match) => match.status === "pending" || (match.status === "active" && match.currentTurnPlayerId !== myId))
                .sort((a, b) => a.expiresAt - b.expiresAt),
        [matches, myId],
    );

    const finished = useMemo(
        () =>
            matches
                .filter((match) => match.status === "completed" || match.status === "expired")
                .sort((a, b) => b.updatedAt - a.updatedAt),
        [matches],
    );

    const heroMatch = toPlay[0] ?? null;
    const heroOpponent = heroMatch?.players.find((player) => player.id !== myId) ?? null;
    const heroMyScore = heroMatch ? computeScore(heroMatch, myId) : 0;

    const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "?";

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
                <View className="hub-header">
                    {avatarUri ? (
                        <Image source={{uri: avatarUri}} className="hub-avatar" />
                    ) : (
                        <View className="hub-avatar">
                            <Text className="hub-avatar-text">{avatarInitial}</Text>
                        </View>
                    )}
                    <View className="min-w-0 flex-1">
                        <Text className="hub-greeting" numberOfLines={1}>
                            Salut, {displayName}
                        </Text>
                        <View className="hub-pills-row">
                            <View className="hub-pill bg-plateau-violet">
                                <Text className="hub-pill-text text-plateau-cream">Niv. {level}</Text>
                            </View>
                            <View className="hub-pill bg-plateau-lime">
                                <Text className="hub-pill-text">{stats.wins} victoire{stats.wins > 1 ? "s" : ""}</Text>
                            </View>
                            {dailyStreak > 1 && (
                                <View className="hub-pill bg-plateau-gold">
                                    <Text className="hub-pill-text">🔥 {dailyStreak} j</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Pressable className="hub-gear-button" onPress={() => router.push("/settings")} accessibilityRole="button" accessibilityLabel="Réglages">
                        <Text className="hub-gear-icon">⚙️</Text>
                    </Pressable>
                </View>

                {heroMatch && heroOpponent ? (
                    <Pressable onPress={() => router.push(`/joute/${heroMatch.id}`)}>
                        <View className="hub-hero-card">
                            <View className="hub-hero-decoration" />
                            <View className="hub-hero-content">
                                <Text className="hub-hero-label">À toi de jouer</Text>
                                <View className="hub-hero-row">
                                    {heroOpponent.avatarUrl ? (
                                        <Image source={{uri: heroOpponent.avatarUrl}} className="hub-hero-avatar" />
                                    ) : (
                                        <View className="hub-hero-avatar">
                                            <Text className="hub-hero-avatar-text">{heroOpponent.displayName.charAt(0).toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <View className="hub-hero-copy">
                                        <Text className="hub-hero-name" numberOfLines={1}>
                                            Duel contre {heroOpponent.displayName}
                                        </Text>
                                        <Text className="hub-hero-meta">
                                            Manche {heroMatch.currentRoundIndex + 1} · {formatTimeRemaining(heroMatch.expiresAt)}
                                        </Text>
                                    </View>
                                    <Text className="hub-hero-score">
                                        {heroMyScore}–{computeScore(heroMatch, heroOpponent.id)}
                                    </Text>
                                </View>
                                <View className="hub-hero-progress-row">
                                    {Array.from({length: WINNING_SCORE}).map((_, index) => (
                                        <View
                                            key={index}
                                            className="hub-hero-progress-seg"
                                            style={{backgroundColor: index < heroMyScore ? plateauColors.lime : "rgba(255,246,226,0.2)"}}
                                        />
                                    ))}
                                </View>
                                <Pressable className="hub-hero-cta" onPress={() => router.push(`/joute/${heroMatch.id}`)}>
                                    <Text className="hub-hero-cta-text">Reprendre la manche</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Pressable>
                ) : (
                    <View className="hub-hero-card">
                        <View className="hub-hero-decoration" />
                        <View className="hub-hero-content">
                            <Text className="hub-hero-label">À toi de jouer</Text>
                            <Text className="hub-hero-empty-title">Aucune partie en cours</Text>
                            <Text className="hub-hero-empty-subtitle">Lance un défi pour commencer.</Text>
                        </View>
                    </View>
                )}

                <Text className="hub-modes-label">Modes de jeu</Text>
                <View className="hub-modes-grid">
                    <HardShadowCard borderRadius={20} offsetY={4} className="hub-mode-card hub-mode-card-wide bg-plateau-orange" style={{width: "100%"}}>
                        <Pressable className="w-full flex-row items-center gap-3" onPress={() => router.push("/duel/lobby")} accessibilityRole="button">
                            <Text className="hub-mode-icon-lg">⚡</Text>
                            <View className="min-w-0 flex-1">
                                <Text className="hub-mode-title-lg text-primary">Face-à-face</Text>
                                <Text className="hub-mode-subtitle text-primary/70">Duel · premier à 9 points gagne</Text>
                            </View>
                            <Text className="hub-mode-arrow">→</Text>
                        </Pressable>
                    </HardShadowCard>

                    <HardShadowCard borderRadius={20} offsetY={4} className="hub-mode-card hub-mode-card-half bg-plateau-violet" style={{width: "47%"}}>
                        <Pressable className="w-full" onPress={() => router.push("/solo")} accessibilityRole="button" accessibilityLabel="Partie solo">
                            <Text className="hub-mode-icon">🎯</Text>
                            <View>
                                <Text className="hub-mode-title text-plateau-cream">Solo</Text>
                                <Text className="hub-mode-subtitle text-plateau-cream/70">Choisis un thème, 10 questions</Text>
                            </View>
                        </Pressable>
                    </HardShadowCard>

                    <HardShadowCard borderRadius={20} offsetY={4} className="hub-mode-card hub-mode-card-half bg-plateau-cyan" style={{width: "47%"}}>
                        <Pressable className="w-full" onPress={() => router.push("/plateau")} accessibilityRole="button" accessibilityLabel="Plateau">
                            <Text className="hub-mode-icon">🏟️</Text>
                            <View>
                                <Text className="hub-mode-title text-primary">Plateau</Text>
                                <Text className="hub-mode-subtitle text-primary/70">4 à 6 joueurs · course à 24 pts</Text>
                            </View>
                        </Pressable>
                    </HardShadowCard>

                    <View className="hub-mode-dashed">
                        <Text className="hub-mode-icon">🔥</Text>
                        <View className="min-w-0 flex-1">
                            <Text className="hub-mode-title text-primary">4 à la suite</Text>
                            <Text className="hub-mode-subtitle text-primary/60">Bientôt disponible</Text>
                        </View>
                    </View>
                </View>

                <View>
                    <ListHeading title="À toi de jouer" />
                    {toPlay.length === 0 ? (
                        <Text className="home-empty-state">Aucune partie en cours — lance un défi pour commencer.</Text>
                    ) : (
                        <View className="gap-4">
                            {toPlay.map((match) => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    viewerId={myId}
                                    variant="toPlay"
                                    onPress={() => router.push(`/joute/${match.id}`)}
                                />
                            ))}
                        </View>
                    )}
                </View>

                <View>
                    <ListHeading title="En attente" />
                    {waiting.length === 0 ? (
                        <Text className="home-empty-state">Aucune partie en attente pour l&#39;instant.</Text>
                    ) : (
                        <View className="gap-4">
                            {waiting.map((match) => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    viewerId={myId}
                                    variant="waiting"
                                    onPress={() => router.push(`/joute/${match.id}`)}
                                />
                            ))}
                        </View>
                    )}
                </View>

                <View>
                    <ListHeading title="Terminées" />
                    {finished.length === 0 ? (
                        <Text className="home-empty-state">Pas encore de partie terminée.</Text>
                    ) : (
                        <View className="gap-4">
                            {finished.map((match) => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    viewerId={myId}
                                    variant="finished"
                                    onPress={() => router.push(`/joute/${match.id}/result`)}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Joute;
