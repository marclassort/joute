import {Image, Pressable, ScrollView, Share, Text, View} from "react-native";
import React from "react";
import ShadowCard from "@/components/ShadowCard";
import PressableScale from "@/components/PressableScale";
import {buildOneWinnerLink, OneWinnerGameSummary} from "@/lib/oneWinnerApi";
import {ONE_WINNER_MAX_PLAYERS, ONE_WINNER_MIN_PLAYERS} from "../hooks/useOneWinnerGame";

export interface OneWinnerWaitingRoomScreenProps {
    gameId: string;
    game: OneWinnerGameSummary;
    isHost: boolean;
    canStart: boolean;
    isStarting: boolean;
    onStart: () => void;
}

const OneWinnerWaitingRoomScreen = ({gameId, game, isHost, canStart, isStarting, onStart}: OneWinnerWaitingRoomScreenProps) => {
    const handleInvite = async () => {
        try {
            await Share.share({message: `Rejoins ma partie "Un seul gagnant" sur Joute ! ${buildOneWinnerLink(gameId)}`});
        } catch {
            // Partage annulé ou indisponible : la partie reste accessible via son lien à repartager plus tard.
        }
    };

    const emptySlots = Math.max(0, ONE_WINNER_MIN_PLAYERS - game.players.length);

    return (
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
                        <PressableScale activeScale={0.98} onPress={onStart} disabled={!canStart || isStarting} accessibilityRole="button">
                            <Text className="solo-cta-text">{isStarting ? "Démarrage…" : "Démarrer la partie"}</Text>
                        </PressableScale>
                    </ShadowCard>
                )}
            </View>
        </>
    );
};

export default OneWinnerWaitingRoomScreen;
