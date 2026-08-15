import {Image, Pressable, ScrollView, Text, View} from "react-native";
import PressableScale from "@/components/PressableScale";
import React, {useMemo} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {useMatches} from "@/features/joute/hooks/useMatches";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {computeScore} from "@/game/rules";
import {formatTimeRemaining} from "@/lib/utils";
import {useGamification} from "@/hooks/useGamification";
import ShadowCard from "@/components/ShadowCard";
import InkPattern from "@/components/InkPattern";
import {plateauColors} from "@/constants/theme";

const SafeAreaView = styled(RNSafeAreaView);

const Home = () => {
    const {id: myId, avatarUrl: myAvatarUri} = useCurrentPlayer();
    const router = useRouter();
    const {matches} = useMatches();
    const {totalXp, currentStreak} = useGamification();

    const toPlay = useMemo(
        () =>
            matches
                .filter((match) => match.status === "active" && match.currentTurnPlayerId === myId)
                .sort((a, b) => a.expiresAt - b.expiresAt),
        [matches, myId],
    );

    const heroMatch = toPlay[0] ?? null;
    const heroOpponent = heroMatch?.players.find((player) => player.id !== myId) ?? null;
    const resumeMatches = toPlay.slice(1, 4);

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper pt-[8px]">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-[14px] px-[18px] pb-[110px]">
                <View className="hub-topbar">
                    <View className="hub-logo-badge">
                        <Text className="hub-logo-mark">J</Text>
                    </View>
                    <Text className="hub-wordmark">Joute</Text>
                    {currentStreak > 0 && (
                        <View className="hub-stat-pill hairline bg-plateau-brass/[0.18] border-plateau-brass/50">
                            <Text className="text-[13px]">🔥</Text>
                            <Text className="hub-stat-pill-text text-plateau-ink">{currentStreak} j</Text>
                        </View>
                    )}
                    <View className="hub-stat-pill hairline">
                        <View className="size-[13px] rounded-full bg-plateau-brass" />
                        <Text className="hub-stat-pill-text text-plateau-ink">{totalXp}</Text>
                    </View>
                </View>

                <PressableScale activeScale={0.98} onPress={() => router.push(heroMatch ? `/joute/${heroMatch.id}` : "/duel/lobby")}>
                    <View className="hub-hero">
                        <InkPattern />
                        <View className="hub-hero-blob" />

                        <View className="hub-hero-eyebrow-row">
                            <View className="hub-hero-eyebrow-dot" />
                            <Text className="text-eyebrow relative text-plateau-paper/65">
                                {heroMatch ? "Duel en cours" : "Face-à-face"}
                            </Text>
                        </View>

                        {heroMatch && heroOpponent ? (
                            <View className="gap-[6px]">
                                <Text className="hub-hero-title" numberOfLines={2}>
                                    Contre {heroOpponent.displayName}
                                </Text>
                                <Text className="hub-hero-subtitle">
                                    Manche {heroMatch.currentRoundIndex + 1} · {formatTimeRemaining(heroMatch.expiresAt)} ·{" "}
                                    {computeScore(heroMatch, myId)}–{computeScore(heroMatch, heroOpponent.id)}
                                </Text>
                            </View>
                        ) : (
                            <View className="gap-[6px]">
                                <Text className="hub-hero-title">Défie un adversaire</Text>
                                <Text className="hub-hero-subtitle">1 contre 1 · premier à 9 points gagne</Text>
                            </View>
                        )}

                        <View className="hub-hero-footer">
                            <View className="hub-hero-avatars">
                                {myAvatarUri ? (
                                    <Image source={{uri: myAvatarUri}} className="hub-hero-avatar-chip" />
                                ) : (
                                    <View className="hub-hero-avatar-chip bg-plateau-teal">
                                        <Text className="hub-hero-avatar-chip-text">Moi</Text>
                                    </View>
                                )}
                                {heroOpponent && (
                                    heroOpponent.avatarUrl ? (
                                        <Image source={{uri: heroOpponent.avatarUrl}} className="hub-hero-avatar-chip" />
                                    ) : (
                                        <View className="hub-hero-avatar-chip">
                                            <Text className="hub-hero-avatar-chip-text">
                                                {heroOpponent.displayName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                    )
                                )}
                            </View>
                            <View className="hub-hero-action">
                                <Text className="hub-hero-action-text">{heroMatch ? "Reprendre" : "Jouer"}</Text>
                                <Text className="hub-hero-action-text">→</Text>
                            </View>
                        </View>
                    </View>
                </PressableScale>

                <View className="hub-tile-row">
                    <ShadowCard borderRadius={22} className="flex-1 hairline rounded-[22px]">
                        <PressableScale className="hub-tile" onPress={() => router.push("/solo")} accessibilityRole="button" accessibilityLabel="Partie solo">
                            <View className="hub-tile-icon bg-plateau-iris/[0.16]">
                                <Text className="text-[17px]">🎯</Text>
                            </View>
                            <View>
                                <Text className="hub-tile-title">Solo</Text>
                                <Text className="hub-tile-subtitle">10 questions</Text>
                            </View>
                        </PressableScale>
                    </ShadowCard>

                    <ShadowCard borderRadius={22} className="flex-1 hairline rounded-[22px]">
                        <PressableScale className="hub-tile" onPress={() => router.push("/plateau")} accessibilityRole="button" accessibilityLabel="Plateau">
                            <View className="hub-tile-icon bg-plateau-teal/[0.18]">
                                <Text className="text-[17px]">🏟️</Text>
                            </View>
                            <View>
                                <Text className="hub-tile-title">Plateau</Text>
                                <Text className="hub-tile-subtitle">4 à 6 joueurs</Text>
                            </View>
                        </PressableScale>
                    </ShadowCard>

                    <ShadowCard borderRadius={22} className="flex-1 hairline rounded-[22px]">
                        <PressableScale className="hub-tile" onPress={() => router.push("/streak")} accessibilityRole="button" accessibilityLabel="4 à la suite">
                            <View className="hub-tile-icon bg-plateau-rose/[0.16]">
                                <Text className="text-[17px]">🔥</Text>
                            </View>
                            <View>
                                <Text className="hub-tile-title">Série</Text>
                                <Text className="hub-tile-subtitle">Sans fin</Text>
                            </View>
                        </PressableScale>
                    </ShadowCard>
                </View>

                <Pressable onPress={() => router.push("/one-winner/new")} accessibilityRole="button" accessibilityLabel="Un seul gagnant">
                    <View className="hub-quest-teaser" style={{backgroundColor: plateauColors.coral}}>
                        <View className="hub-quest-teaser-icon">
                            <Text className="text-[20px]">🏆</Text>
                        </View>
                        <View className="hub-quest-teaser-copy">
                            <Text className="hub-quest-teaser-title">Un seul gagnant</Text>
                            <Text className="hub-quest-teaser-subtitle">4 à 6 joueurs · éliminations en direct</Text>
                        </View>
                        <Text className="text-[17px] text-plateau-paper">›</Text>
                    </View>
                </Pressable>

                {resumeMatches.length > 0 && (
                    <>
                        <View className="hub-section-head">
                            <Text className="text-eyebrow text-plateau-ink/[0.45]">À reprendre</Text>
                            <Pressable onPress={() => router.push("/joute")}>
                                <Text className="hub-section-link">Tout voir</Text>
                            </Pressable>
                        </View>
                        <View className="gap-[9px]">
                            {resumeMatches.map((match) => {
                                const opponent = match.players.find((player) => player.id !== myId);
                                if (!opponent) return null;
                                return (
                                    <Pressable key={match.id} className="hub-resume-row hairline" onPress={() => router.push(`/joute/${match.id}`)}>
                                        {opponent.avatarUrl ? (
                                            <Image source={{uri: opponent.avatarUrl}} className="hub-resume-avatar" />
                                        ) : (
                                            <View className="hub-resume-avatar bg-plateau-iris">
                                                <Text className="hub-resume-avatar-text">{opponent.displayName.charAt(0).toUpperCase()}</Text>
                                            </View>
                                        )}
                                        <View className="hub-resume-copy">
                                            <Text className="hub-resume-name" numberOfLines={1}>
                                                Contre {opponent.displayName}
                                            </Text>
                                            <Text className="hub-resume-meta">
                                                Manche {match.currentRoundIndex + 1} · {formatTimeRemaining(match.expiresAt)}
                                            </Text>
                                        </View>
                                        <Text className="hub-resume-score">
                                            {computeScore(match, myId)}–{computeScore(match, opponent.id)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </>
                )}

                <Pressable onPress={() => router.push("/quests")}>
                    <View className="hub-quest-teaser">
                        <View className="hub-quest-teaser-icon">
                            <Text className="text-[20px]">🗺️</Text>
                        </View>
                        <View className="hub-quest-teaser-copy">
                            <Text className="hub-quest-teaser-title">Quêtes journalières</Text>
                            <Text className="hub-quest-teaser-subtitle">De nouveaux défis t&#39;attendent</Text>
                        </View>
                        <Text className="text-[17px] text-plateau-paper">›</Text>
                    </View>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Home;
