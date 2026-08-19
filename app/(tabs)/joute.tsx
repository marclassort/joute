import {ScrollView, Text, View} from "react-native";
import React, {useMemo} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import ListHeading from "@/components/ListHeading";
import {useMatches} from "@/features/joute/hooks/useMatches";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import MatchCard from "@/features/joute/components/MatchCard";
import PrimaryButton from "@/components/PrimaryButton";

const SafeAreaView = styled(RNSafeAreaView);

const Duels = () => {
    const {id: myId} = useCurrentPlayer();
    const router = useRouter();
    const {matches} = useMatches();

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

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper p-5">
            <View className="flex-row items-center justify-between">
                <Text className="settings-title">Duels</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
                <PrimaryButton title="Nouveau duel" onPress={() => router.push("/duel/lobby")} />

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

export default Duels;
