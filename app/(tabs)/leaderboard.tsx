import {Image, ScrollView, Text, View} from "react-native";
import React, {useCallback, useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useAuth} from "@clerk/expo";
import {useFocusEffect} from "@react-navigation/native";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {fetchLeaderboard, LeaderboardEntry} from "@/lib/api";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {plateauColors} from "@/constants/theme";

const SafeAreaView = styled(RNSafeAreaView);

// Index 0 = rang 1, 1 = rang 2, 2 = rang 3.
const PODIUM_COLORS = [plateauColors.brass, plateauColors.teal, plateauColors.rose];
const PODIUM_SIZE = [62, 52, 52];
const PODIUM_HEIGHT = [106, 78, 60];
// Ordre d'affichage à l'écran (2e, 1er, 3e) pour mettre le 1er au centre, en avant.
const PODIUM_DISPLAY_ORDER = [1, 0, 2];

const Leaderboard = () => {
    const {id: myId} = useCurrentPlayer();
    const {isSignedIn, getToken} = useAuth();
    const [top, setTop] = useState<LeaderboardEntry[] | null>(null);
    const [me, setMe] = useState<LeaderboardEntry | null>(null);
    const [unavailable, setUnavailable] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!isSignedIn) return;
            let cancelled = false;

            (async () => {
                try {
                    const token = await getToken();
                    const data = await fetchLeaderboard(token);
                    if (cancelled) return;
                    setTop(data.top);
                    setMe(data.me);
                    setUnavailable(false);
                } catch {
                    if (!cancelled) setUnavailable(true);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [isSignedIn, getToken]),
    );

    const podiumEntries = top?.slice(0, 3) ?? [];
    const restEntries = top?.slice(3, 10) ?? [];

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper px-[18px] pt-[8px]">
            <View className="leaderboard-title-row">
                <Text className="text-screen-title text-plateau-ink">Classement</Text>
                <View className="leaderboard-scope-pill">
                    <Text className="leaderboard-scope-pill-text">Monde</Text>
                </View>
            </View>

            {!isSignedIn ? (
                <View className="leaderboard-empty-card">
                    <Text className="text-eyebrow text-plateau-ink/45">Classement mondial</Text>
                    <Text className="home-empty-state">Crée un compte pour figurer au classement mondial.</Text>
                </View>
            ) : unavailable || !top ? (
                <View className="leaderboard-empty-card">
                    <Text className="home-empty-state">Classement indisponible pour le moment.</Text>
                </View>
            ) : top.length === 0 ? (
                <View className="leaderboard-empty-card">
                    <Text className="home-empty-state">Sois le premier à jouer pour ouvrir le classement !</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-[14px] pb-[110px]">
                    <View className="leaderboard-podium-row">
                        {PODIUM_DISPLAY_ORDER.map((rankIndex) => {
                            const entry = podiumEntries[rankIndex];
                            if (!entry) return <View key={rankIndex} className="flex-1" />;
                            return (
                                <View key={entry.id} className="leaderboard-podium-item">
                                    <View
                                        className="leaderboard-podium-avatar"
                                        style={{width: PODIUM_SIZE[rankIndex], height: PODIUM_SIZE[rankIndex], backgroundColor: PODIUM_COLORS[rankIndex]}}
                                    >
                                        {entry.avatarUrl ? (
                                            <Image source={{uri: entry.avatarUrl}} style={{width: "100%", height: "100%"}} />
                                        ) : (
                                            <Text className="leaderboard-podium-avatar-text">{entry.displayName.charAt(0).toUpperCase()}</Text>
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

                    <View className="gap-[8px]">
                        {restEntries.map((entry) => (
                            <LeaderboardRow key={entry.id} entry={entry} isMe={entry.id === myId} />
                        ))}
                        {me && me.rank > 10 && (
                            <>
                                <Text className="leaderboard-separator">···</Text>
                                <LeaderboardRow entry={me} isMe />
                            </>
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const LeaderboardRow = ({entry, isMe}: {entry: LeaderboardEntry; isMe: boolean}) => (
    <View className={clsx("leaderboard-row", isMe && "leaderboard-row-me")}>
        <Text className={clsx("leaderboard-row-rank", isMe && "leaderboard-row-rank-me")}>{entry.rank}</Text>
        <View className="leaderboard-row-avatar-frame">
            {entry.avatarUrl ? (
                <Image source={{uri: entry.avatarUrl}} style={{width: "100%", height: "100%"}} />
            ) : (
                <Text className="leaderboard-row-avatar-text">{entry.displayName.charAt(0).toUpperCase()}</Text>
            )}
        </View>
        <Text className={clsx("leaderboard-row-name", isMe && "leaderboard-row-name-me")} numberOfLines={1}>
            {isMe ? "Toi" : entry.displayName}
        </Text>
        <Text className={clsx("leaderboard-row-score", isMe && "leaderboard-row-score-me")}>{entry.totalXp}</Text>
    </View>
);

export default Leaderboard;
