import {Image, Pressable, ScrollView, Share, Text, View} from "react-native";
import React, {useState} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import ShadowCard from "@/components/ShadowCard";
import PressableScale from "@/components/PressableScale";
import {buildOneWinnerLink, OneWinnerGameSummary} from "@/lib/oneWinnerApi";
import {ONE_WINNER_PLAYERS} from "../hooks/useOneWinnerGame";

export interface OneWinnerWaitingRoomScreenProps {
    gameId: string;
    game: OneWinnerGameSummary;
    isHost: boolean;
    canStart: boolean;
    isStarting: boolean;
    onStart: () => void;
    /** Dev uniquement (npx expo start -c) : remplit les places restantes avec des invités fantômes qui
     * jouent tout seuls, pour tester l'UI/UX sans piloter plusieurs appareils. Absent en production. */
    onSpawnGhosts?: (count: number) => Promise<void>;
}

const OneWinnerWaitingRoomScreen = ({gameId, game, isHost, canStart, isStarting, onStart, onSpawnGhosts}: OneWinnerWaitingRoomScreenProps) => {
    const [isSpawningGhosts, setIsSpawningGhosts] = useState(false);

    const handleInvite = async () => {
        try {
            await Share.share({message: `Rejoins ma partie "Un seul gagnant" sur Joute ! ${buildOneWinnerLink(gameId)}`});
        } catch {
            // Partage annulé ou indisponible : la partie reste accessible via son lien à repartager plus tard.
        }
    };

    const emptySlots = Math.max(0, ONE_WINNER_PLAYERS - game.players.length);
    const ghostSlotsAvailable = emptySlots;

    const handleSpawnGhosts = async () => {
        if (!onSpawnGhosts || ghostSlotsAvailable === 0) return;
        setIsSpawningGhosts(true);
        try {
            await onSpawnGhosts(ghostSlotsAvailable);
        } finally {
            setIsSpawningGhosts(false);
        }
    };

    return (
        <>
            <View className="mt-5 flex-row items-center justify-between">
                <Text className="solo-hero-title text-plateau-paper">En attente…</Text>
                <View className="one-winner-count-pill">
                    <Text className="one-winner-count-pill-text">
                        {game.players.length}/{ONE_WINNER_PLAYERS}
                    </Text>
                </View>
            </View>
            <Text className="solo-hero-subtitle text-plateau-paper/60">{ONE_WINNER_PLAYERS} joueurs pour démarrer.</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="mt-5 gap-3 pb-6">
                {game.players.map((player, index) => (
                    <View key={player.id} className={clsx("one-winner-player-row", !player.isConnected && "one-winner-standing-eliminated")}>
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
                        {!player.isConnected && <Text className="one-winner-offline-text">hors ligne</Text>}
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
                {__DEV__ && onSpawnGhosts && ghostSlotsAvailable > 0 && (
                    <Pressable
                        className="duel-lobby-secondary-button"
                        onPress={handleSpawnGhosts}
                        disabled={isSpawningGhosts}
                        accessibilityRole="button"
                    >
                        <Text className="duel-lobby-secondary-text">
                            {isSpawningGhosts ? "Ajout…" : `👻 Ajouter ${ghostSlotsAvailable} invité(s) fantôme(s) (dev)`}
                        </Text>
                    </Pressable>
                )}
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
