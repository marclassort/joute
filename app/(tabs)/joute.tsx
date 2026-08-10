import {Image, Pressable, ScrollView, Text, View} from "react-native";
import React, {useMemo, useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useUser} from "@clerk/expo";
import {useRouter} from "expo-router";
import ListHeading from "@/components/ListHeading";
import {useMatches} from "@/features/joute/hooks/useMatches";
import {computeMatchStats} from "@/game/rules";
import {createMatch} from "@/game/engine";
import {Player} from "@/game/types";
import ghosts from "@/data/ghosts";
import {generateId} from "@/lib/utils";
import MatchCard from "@/features/joute/components/MatchCard";
import NewMatchModal from "@/features/joute/components/NewMatchModal";

const SafeAreaView = styled(RNSafeAreaView);

const Joute = () => {
    const {user} = useUser();
    const router = useRouter();
    const {matches, saveMatch} = useMatches();
    const [isNewMatchModalVisible, setNewMatchModalVisible] = useState(false);

    const myId = user?.id ?? "";
    const displayName = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "Moi";
    const avatarUri = user?.imageUrl;

    const stats = useMemo(() => computeMatchStats(matches, myId), [matches, myId]);

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

    const handleRandomOpponent = async () => {
        if (!myId) return;

        const ghost = ghosts[Math.floor(Math.random() * ghosts.length)];
        const me: Player = {id: myId, displayName, avatarUrl: avatarUri ?? null, isGhost: false};
        const opponent: Player = {id: ghost.id, displayName: ghost.displayName, avatarUrl: ghost.avatarUrl, isGhost: true};

        const match = createMatch({id: generateId("match"), players: [me, opponent]});
        await saveMatch(match);
        setNewMatchModalVisible(false);
        router.push(`/joute/${match.id}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
                <View className="joute-header">
                    {avatarUri ? (
                        <Image source={{uri: avatarUri}} className="joute-avatar" />
                    ) : (
                        <View className="joute-avatar bg-muted" />
                    )}
                    <View className="joute-header-copy">
                        <Text className="joute-header-name" numberOfLines={1}>
                            {displayName}
                        </Text>
                        <View className="joute-stats-row">
                            <Text className="joute-stats-text">{stats.wins} V</Text>
                            <Text className="joute-stats-text">{stats.losses} D</Text>
                            <Text className="joute-stats-text">{stats.draws} N</Text>
                            {stats.currentStreak > 1 && (
                                <Text className="joute-stats-streak">Série de {stats.currentStreak}</Text>
                            )}
                        </View>
                    </View>
                </View>

                <Pressable className="joute-new-match-button" onPress={() => setNewMatchModalVisible(true)}>
                    <Text className="joute-new-match-text">Nouvelle partie</Text>
                </Pressable>

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

            <NewMatchModal
                visible={isNewMatchModalVisible}
                onClose={() => setNewMatchModalVisible(false)}
                onRandomOpponent={handleRandomOpponent}
            />
        </SafeAreaView>
    );
};

export default Joute;
