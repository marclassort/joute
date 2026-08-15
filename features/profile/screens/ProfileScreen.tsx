import {Image, Pressable, ScrollView, Text, View} from "react-native";
import React, {useCallback, useMemo, useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {useFocusEffect} from "@react-navigation/native";
import {useAuth} from "@clerk/expo";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {useMatches} from "@/features/joute/hooks/useMatches";
import {DRAWABLE_CATEGORIES, computeMatchStats} from "@/game/rules";
import {computeLevel} from "@/game/gamification";
import {computeEarnedBadges} from "@/game/badges";
import {computePlateauStandings} from "@/game/plateauEngine";
import {useGamification} from "@/hooks/useGamification";
import {useSoloStats} from "@/features/solo/hooks/useSoloStats";
import {masteryPercent} from "@/services/localSoloStatsRepository";
import {usePlateauMatches} from "@/features/plateau/hooks/usePlateauMatches";
import {useStreakStats} from "@/features/streak/hooks/useStreakStats";
import {CATEGORY_LABELS} from "@/features/joute/constants";
import {plateauColors} from "@/constants/theme";
import {fetchLeaderboard, LeaderboardEntry} from "@/lib/api";
import InkPattern from "@/components/InkPattern";

const SafeAreaView = styled(RNSafeAreaView);

const MASTERY_COLORS = [plateauColors.ink, plateauColors.rose, plateauColors.teal, plateauColors.iris, plateauColors.coral];

// Index 0 = rang 1, 1 = rang 2, 2 = rang 3.
const PODIUM_COLORS = [plateauColors.brass, plateauColors.teal, plateauColors.rose];
const PODIUM_SIZE = [62, 52, 52];
const PODIUM_HEIGHT = [106, 78, 60];
// Ordre d'affichage à l'écran (2e, 1er, 3e) pour mettre le 1er au centre, en avant.
const PODIUM_DISPLAY_ORDER = [1, 0, 2];

const ProfileScreen = () => {
    const router = useRouter();
    const {displayName, avatarUrl, id: myId} = useCurrentPlayer();
    const {totalXp, currentStreak: dailyStreak, longestStreak} = useGamification();
    const {matches} = useMatches();
    const {matches: plateauMatches} = usePlateauMatches();
    const {stats: soloStats} = useSoloStats();
    const {bestStreak: bestFreeAnswerStreak} = useStreakStats();
    const {isSignedIn, getToken} = useAuth();
    const [leaderboardTop, setLeaderboardTop] = useState<LeaderboardEntry[] | null>(null);
    const [leaderboardMe, setLeaderboardMe] = useState<LeaderboardEntry | null>(null);
    const [leaderboardUnavailable, setLeaderboardUnavailable] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!isSignedIn) return;
            let cancelled = false;

            (async () => {
                try {
                    const token = await getToken();
                    const data = await fetchLeaderboard(token);
                    if (cancelled) return;
                    setLeaderboardTop(data.top);
                    setLeaderboardMe(data.me);
                    setLeaderboardUnavailable(false);
                } catch {
                    if (!cancelled) setLeaderboardUnavailable(true);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [isSignedIn, getToken]),
    );

    const duelStats = useMemo(() => computeMatchStats(matches, myId), [matches, myId]);
    const plateauWins = useMemo(
        () => plateauMatches.filter((match) => match.status === "completed" && computePlateauStandings(match)[0]?.player.id === myId).length,
        [plateauMatches, myId],
    );
    const level = computeLevel(totalXp);
    const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "?";

    const badges = useMemo(
        () =>
            computeEarnedBadges({
                soloStats,
                totalXp,
                currentStreak: dailyStreak,
                longestStreak,
                duelWins: duelStats.wins,
                plateauWins,
                bestFreeAnswerStreak,
                level,
            }),
        [soloStats, totalXp, dailyStreak, longestStreak, duelStats.wins, plateauWins, bestFreeAnswerStreak, level],
    );

    const masteryRows = useMemo(
        () =>
            DRAWABLE_CATEGORIES.map((category) => ({category, percent: masteryPercent(soloStats[category])}))
                .filter((row): row is {category: (typeof DRAWABLE_CATEGORIES)[number]; percent: number} => row.percent !== null)
                .sort((a, b) => b.percent - a.percent),
        [soloStats],
    );

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper p-5">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
                <View className="profile-header-card">
                    <InkPattern />
                    <View className="profile-header-content">
                        <View className="profile-header-row">
                            {avatarUrl ? (
                                <Image source={{uri: avatarUrl}} className="profile-avatar" />
                            ) : (
                                <View className="profile-avatar">
                                    <Text className="profile-avatar-text">{avatarInitial}</Text>
                                </View>
                            )}
                            <View className="min-w-0 flex-1">
                                <Text className="profile-name" numberOfLines={1}>
                                    {displayName}
                                </Text>
                                <Text className="profile-level-label">Niv. {level}</Text>
                            </View>
                            <Pressable className="hub-gear-button" onPress={() => router.push("/settings")} accessibilityRole="button" accessibilityLabel="Réglages">
                                <Text className="hub-gear-icon">⚙️</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className="profile-stats-row">
                        <View className="profile-stat-chip">
                            <Text className="profile-stat-value" style={{color: plateauColors.teal}}>
                                {totalXp}
                            </Text>
                            <Text className="profile-stat-label">XP</Text>
                        </View>
                        <View className="profile-stat-chip">
                            <Text className="profile-stat-value" style={{color: plateauColors.brass}}>
                                {dailyStreak} 🔥
                            </Text>
                            <Text className="profile-stat-label">Série</Text>
                        </View>
                        <View className="profile-stat-chip">
                            <Text className="profile-stat-value">
                                {duelStats.wins}-{duelStats.losses}
                            </Text>
                            <Text className="profile-stat-label">V-D</Text>
                        </View>
                    </View>
                </View>

                {badges.length > 0 && (
                    <View>
                        <Text className="hub-modes-label">Badges</Text>
                        <View className="profile-badges-row">
                            {badges.map((badge) => (
                                <View key={badge.id} className="profile-badge-pill">
                                    <Text className="profile-badge-icon">{badge.icon}</Text>
                                    <Text className="profile-badge-text">{badge.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View>
                    <Text className="hub-modes-label">Maîtrise par thème</Text>
                    {masteryRows.length === 0 ? (
                        <Text className="home-empty-state">Joue une partie solo pour voir ta maîtrise par thème.</Text>
                    ) : (
                        <View className="gap-[9px]">
                            {masteryRows.map(({category, percent}, index) => (
                                <View key={category} className="profile-mastery-row">
                                    <Text className="profile-mastery-label" numberOfLines={1}>
                                        {CATEGORY_LABELS[category]}
                                    </Text>
                                    <View className="profile-mastery-track">
                                        <View
                                            className="profile-mastery-fill"
                                            style={{width: `${percent}%`, backgroundColor: MASTERY_COLORS[index % MASTERY_COLORS.length]}}
                                        />
                                    </View>
                                    <Text className="profile-mastery-percent">{percent}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View>
                    <Text className="hub-modes-label">Classement mondial</Text>
                    {!isSignedIn ? (
                        <View className="profile-leaderboard-card">
                            <Text className="profile-leaderboard-text">
                                Crée un compte pour figurer au classement mondial.
                            </Text>
                        </View>
                    ) : leaderboardUnavailable || !leaderboardTop ? (
                        <View className="profile-leaderboard-card">
                            <Text className="profile-leaderboard-text">Classement indisponible pour le moment.</Text>
                        </View>
                    ) : leaderboardTop.length === 0 ? (
                        <View className="profile-leaderboard-card">
                            <Text className="profile-leaderboard-text">Sois le premier à jouer pour ouvrir le classement !</Text>
                        </View>
                    ) : (
                        <View className="gap-[14px]">
                            <View className="leaderboard-podium-row">
                                {PODIUM_DISPLAY_ORDER.map((rankIndex) => {
                                    const entry = leaderboardTop[rankIndex];
                                    if (!entry) return <View key={rankIndex} className="flex-1" />;
                                    return (
                                        <View key={entry.id} className="leaderboard-podium-item">
                                            <View
                                                className="leaderboard-podium-avatar"
                                                style={{
                                                    width: PODIUM_SIZE[rankIndex],
                                                    height: PODIUM_SIZE[rankIndex],
                                                    backgroundColor: PODIUM_COLORS[rankIndex],
                                                }}
                                            >
                                                {entry.avatarUrl ? (
                                                    <Image source={{uri: entry.avatarUrl}} style={{width: "100%", height: "100%"}} />
                                                ) : (
                                                    <Text className="leaderboard-podium-avatar-text">
                                                        {entry.displayName.charAt(0).toUpperCase()}
                                                    </Text>
                                                )}
                                            </View>
                                            <View className="leaderboard-podium-card" style={{height: PODIUM_HEIGHT[rankIndex]}}>
                                                <Text className="leaderboard-podium-rank">{entry.rank}</Text>
                                                <Text className="leaderboard-podium-name" numberOfLines={1}>
                                                    {entry.id === myId ? "Toi" : entry.displayName}
                                                </Text>
                                                <Text className="leaderboard-podium-score">{entry.totalXp}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>

                            <View className="gap-2">
                                {leaderboardTop.slice(3, 10).map((entry) => (
                                    <LeaderboardRow key={entry.id} entry={entry} isMe={entry.id === myId} />
                                ))}
                                {leaderboardMe && leaderboardMe.rank > 10 && (
                                    <>
                                        <Text className="profile-leaderboard-separator">···</Text>
                                        <LeaderboardRow entry={leaderboardMe} isMe />
                                    </>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const LeaderboardRow = ({entry, isMe}: {entry: LeaderboardEntry; isMe: boolean}) => (
    <View className={clsx("profile-leaderboard-row", isMe && "profile-leaderboard-row-me")}>
        <Text className={clsx("profile-leaderboard-rank", isMe && "profile-leaderboard-rank-me")}>{entry.rank}</Text>
        {entry.avatarUrl ? (
            <Image source={{uri: entry.avatarUrl}} className="profile-leaderboard-avatar" />
        ) : (
            <View className="profile-leaderboard-avatar" />
        )}
        <Text className={clsx("profile-leaderboard-name", isMe && "profile-leaderboard-name-me")} numberOfLines={1}>
            {isMe ? "Toi" : entry.displayName}
        </Text>
        <Text className={clsx("profile-leaderboard-xp", isMe && "profile-leaderboard-xp-me")}>{entry.totalXp}</Text>
    </View>
);

export default ProfileScreen;
