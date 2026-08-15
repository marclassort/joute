import {Image, Pressable, ScrollView, Share, Text, View} from "react-native";
import React from "react";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {buildOneWinnerLink} from "@/lib/oneWinnerApi";
import ShadowCard from "@/components/ShadowCard";
import PressableScale from "@/components/PressableScale";
import {ONE_WINNER_MAX_PLAYERS, ONE_WINNER_MIN_PLAYERS, useOneWinnerLobby} from "../hooks/useOneWinnerLobby";

const SafeAreaView = styled(RNSafeAreaView);

export interface OneWinnerWaitingRoomScreenProps {
    gameId: string;
}

const OneWinnerWaitingRoomScreen = ({gameId}: OneWinnerWaitingRoomScreenProps) => {
    const router = useRouter();
    const {game, isLoading, error, isHost, canStart, isStarting, start} = useOneWinnerLobby(gameId);

    const handleInvite = async () => {
        try {
            await Share.share({message: `Rejoins ma partie "Un seul gagnant" sur Joute ! ${buildOneWinnerLink(gameId)}`});
        } catch {
            // Partage annulé ou indisponible : la partie reste accessible via son lien à repartager plus tard.
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <View className="joute-skeleton" />
            </SafeAreaView>
        );
    }

    if (error || !game) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <View className="duel-header">
                    <Pressable className="duel-close-button" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
                        <Text className="duel-close-icon">←</Text>
                    </Pressable>
                    <Text className="duel-header-title">Un seul gagnant</Text>
                    <View className="size-9" />
                </View>
                <Text className="home-empty-state mt-6 text-center text-plateau-paper/60">{error ?? "Partie introuvable."}</Text>
            </SafeAreaView>
        );
    }

    const emptySlots = Math.max(0, ONE_WINNER_MIN_PLAYERS - game.players.length);

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <View className="duel-header">
                <Pressable className="duel-close-button" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="duel-close-icon">←</Text>
                </Pressable>
                <Text className="duel-header-title">Salle d&#39;attente</Text>
                <View className="size-9" />
            </View>

            {game.phase !== "lobby" ? (
                <View className="mt-8 items-center gap-2">
                    <Text className="solo-hero-title text-center text-plateau-paper">La partie a démarré !</Text>
                    <Text className="solo-hero-subtitle text-center text-plateau-paper/60">
                        L&#39;écran de jeu arrive bientôt — reviens un peu plus tard.
                    </Text>
                </View>
            ) : (
                <>
                    <View className="mt-5 flex-row items-center justify-between">
                        <Text className="solo-hero-title text-plateau-paper">En attente…</Text>
                        <View className="one-winner-count-pill">
                            <Text className="one-winner-count-pill-text">
                                {game.players.length}/{ONE_WINNER_MAX_PLAYERS}
                            </Text>
                        </View>
                    </View>
                    <Text className="solo-hero-subtitle text-plateau-paper/60">{ONE_WINNER_MIN_PLAYERS} joueurs minimum pour démarrer.</Text>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="mt-5 gap-3 pb-6">
                        {game.players.map((player, index) => (
                            <View key={player.id} className="one-winner-player-row">
                                {player.avatarUrl ? (
                                    <Image source={{uri: player.avatarUrl}} className="one-winner-player-avatar" />
                                ) : (
                                    <View className="one-winner-player-avatar">
                                        <Text className="one-winner-player-avatar-text">{player.displayName.charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                                <Text className="one-winner-player-name" numberOfLines={1}>
                                    {player.displayName}
                                </Text>
                                {index === 0 && (
                                    <View className="one-winner-host-badge">
                                        <Text className="one-winner-host-badge-text">HÔTE</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                        {Array.from({length: emptySlots}).map((_, i) => (
                            <View key={`empty-${i}`} className="one-winner-slot-empty">
                                <View className="one-winner-slot-empty-avatar" />
                                <Text className="one-winner-slot-empty-text">En attente d&#39;un joueur…</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View className="mt-auto gap-3">
                        <Pressable className="duel-lobby-secondary-button" onPress={handleInvite} accessibilityRole="button">
                            <Text className="duel-lobby-secondary-text">Inviter des joueurs</Text>
                        </Pressable>
                        {isHost && (
                            <ShadowCard borderRadius={20} className={!canStart || isStarting ? "solo-cta-button opacity-50" : "solo-cta-button"}>
                                <PressableScale activeScale={0.98} onPress={start} disabled={!canStart || isStarting} accessibilityRole="button">
                                    <Text className="solo-cta-text">{isStarting ? "Démarrage…" : "Démarrer la partie"}</Text>
                                </PressableScale>
                            </ShadowCard>
                        )}
                    </View>
                </>
            )}
        </SafeAreaView>
    );
};

export default OneWinnerWaitingRoomScreen;
