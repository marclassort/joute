import {Image, Pressable, ScrollView, Text, View} from "react-native";
import React, {useMemo} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
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

const SafeAreaView = styled(RNSafeAreaView);

const MASTERY_COLORS = [plateauColors.ink, plateauColors.pink, plateauColors.cyan, plateauColors.violet, plateauColors.orange];

const ProfileScreen = () => {
    const router = useRouter();
    const {displayName, avatarUrl, id: myId} = useCurrentPlayer();
    const {totalXp, currentStreak: dailyStreak, longestStreak} = useGamification();
    const {matches} = useMatches();
    const {matches: plateauMatches} = usePlateauMatches();
    const {stats: soloStats} = useSoloStats();
    const {bestStreak: bestFreeAnswerStreak} = useStreakStats();

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
        <SafeAreaView className="flex-1 bg-background p-5">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
                <View className="flex-row items-center justify-between">
                    <Text className="settings-title">Profil</Text>
                    <Pressable className="hub-gear-button" onPress={() => router.push("/settings")} accessibilityRole="button" accessibilityLabel="Réglages">
                        <Text className="hub-gear-icon">⚙️</Text>
                    </Pressable>
                </View>

                <View className="profile-header-card">
                    <View className="profile-header-decoration" />
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
                                <Text className="profile-level-label">Niveau {level}</Text>
                            </View>
                        </View>

                        <View className="profile-stats-row">
                            <View className="profile-stat-chip">
                                <Text className="profile-stat-value" style={{color: plateauColors.lime}}>
                                    {totalXp}
                                </Text>
                                <Text className="profile-stat-label">XP</Text>
                            </View>
                            <View className="profile-stat-chip">
                                <Text className="profile-stat-value" style={{color: plateauColors.gold}}>
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
                    <View className="profile-leaderboard-card">
                        <Text className="profile-leaderboard-text">
                            Le classement mondial arrive bientôt — il faudra un compte pour y figurer.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;
