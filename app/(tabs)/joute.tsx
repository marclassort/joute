import {Image, Pressable, ScrollView, Share, Text, View} from "react-native";
import React, {useMemo, useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import ListHeading from "@/components/ListHeading";
import {useMatches} from "@/features/joute/hooks/useMatches";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {computeMatchStats, computeScore} from "@/game/rules";
import {createMatch} from "@/game/engine";
import {Player, QUESTIONS_PER_ROUND, ROUNDS_PER_MATCH} from "@/game/types";
import ghosts from "@/data/ghosts";
import {generateId, formatTimeRemaining} from "@/lib/utils";
import {plateauColors} from "@/constants/theme";
import {buildInvitationLink, generateInvitationCode} from "@/services/invitations";
import {localInvitationRepository} from "@/services/localInvitationRepository";
import {localNotificationService} from "@/services/localNotificationService";
import MatchCard from "@/features/joute/components/MatchCard";
import NewMatchModal from "@/features/joute/components/NewMatchModal";
import HardShadowCard from "@/features/joute/components/HardShadowCard";

const SafeAreaView = styled(RNSafeAreaView);

const Joute = () => {
    const {id: myId, displayName, avatarUrl: avatarUri} = useCurrentPlayer();
    const router = useRouter();
    const {matches, saveMatch} = useMatches();
    const [isNewMatchModalVisible, setNewMatchModalVisible] = useState(false);

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

    const heroMatch = toPlay[0] ?? null;
    const heroOpponent = heroMatch?.players.find((player) => player.id !== myId) ?? null;
    const heroCompletedRounds = heroMatch
        ? heroMatch.rounds.filter((round) => round.answers.length >= QUESTIONS_PER_ROUND * 2).length
        : 0;

    const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "?";

    // Demande la permission de notifications au moment utile : juste après la création de la toute première partie, jamais au lancement.
    // Ne doit jamais bloquer la suite (fermeture de la modale, navigation) si la permission échoue ou si le module est indisponible (ex. Expo Go).
    const maybeRequestNotificationPermission = async () => {
        if (matches.length === 0) {
            try {
                await localNotificationService.requestPermission();
            } catch {
                // Ignoré volontairement — voir le commentaire ci-dessus.
            }
        }
    };

    const handleRandomOpponent = async () => {
        if (!myId) return;

        const ghost = ghosts[Math.floor(Math.random() * ghosts.length)];
        const me: Player = {id: myId, displayName, avatarUrl: avatarUri ?? null, isGhost: false};
        const opponent: Player = {id: ghost.id, displayName: ghost.displayName, avatarUrl: ghost.avatarUrl, isGhost: true};

        const match = createMatch({id: generateId("match"), players: [me, opponent]});
        await saveMatch(match);
        await maybeRequestNotificationPermission();
        setNewMatchModalVisible(false);
        router.push(`/joute/${match.id}`);
    };

    const handleInviteFriend = async () => {
        if (!myId) return;

        const code = generateInvitationCode();
        const me: Player = {id: myId, displayName, avatarUrl: avatarUri ?? null, isGhost: false};
        const placeholder: Player = {id: code, displayName: "En attente…", avatarUrl: null, isGhost: false};

        const match = createMatch({id: generateId("match"), players: [me, placeholder], invitationCode: code, status: "pending"});
        await localInvitationRepository.create({code, matchId: match.id, creatorId: myId, createdAt: Date.now(), usedByPlayerId: null});
        await saveMatch(match);
        await maybeRequestNotificationPermission();
        setNewMatchModalVisible(false);

        try {
            await Share.share({message: `Rejoins mon défi Joute ! ${buildInvitationLink(code)}`});
        } catch {
            // Partage annulé ou indisponible : la partie reste visible dans « En attente » pour repartager plus tard.
        }
    };

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
                            <View className="hub-pill bg-plateau-lime">
                                <Text className="hub-pill-text">{stats.wins} victoire{stats.wins > 1 ? "s" : ""}</Text>
                            </View>
                            {stats.currentStreak > 1 && (
                                <View className="hub-pill bg-plateau-gold">
                                    <Text className="hub-pill-text">Série {stats.currentStreak}</Text>
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
                                        Manche {Math.min(heroMatch.currentRoundIndex + 1, ROUNDS_PER_MATCH)} sur {ROUNDS_PER_MATCH} · {formatTimeRemaining(heroMatch.expiresAt)}
                                    </Text>
                                </View>
                                <Text className="hub-hero-score">
                                    {computeScore(heroMatch, myId)}–{computeScore(heroMatch, heroOpponent.id)}
                                </Text>
                            </View>
                            <View className="hub-hero-progress-row">
                                {Array.from({length: ROUNDS_PER_MATCH}).map((_, index) => (
                                    <View
                                        key={index}
                                        className="hub-hero-progress-seg"
                                        style={{
                                            backgroundColor:
                                                index < heroCompletedRounds
                                                    ? plateauColors.lime
                                                    : index === heroMatch.currentRoundIndex
                                                      ? plateauColors.orange
                                                      : "rgba(255,246,226,0.2)",
                                        }}
                                    />
                                ))}
                            </View>
                            <Pressable className="hub-hero-cta" onPress={() => router.push(`/joute/${heroMatch.id}`)}>
                                <Text className="hub-hero-cta-text">Reprendre la manche</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                ) : (
                    <View className="hub-hero-card">
                        <View className="hub-hero-decoration" />
                        <Text className="hub-hero-label">À toi de jouer</Text>
                        <Text className="hub-hero-empty-title">Aucune partie en cours</Text>
                        <Text className="hub-hero-empty-subtitle">Lance un défi pour commencer.</Text>
                    </View>
                )}

                <Text className="hub-modes-label">Modes de jeu</Text>
                <View className="hub-modes-grid">
                    <HardShadowCard borderRadius={20} offsetY={4} className="hub-mode-card hub-mode-card-wide bg-plateau-orange" style={{width: "100%"}}>
                        <Pressable className="w-full flex-row items-center gap-3" onPress={() => setNewMatchModalVisible(true)} accessibilityRole="button">
                            <Text className="hub-mode-icon-lg">⚡</Text>
                            <View className="min-w-0 flex-1">
                                <Text className="hub-mode-title-lg text-primary">Face-à-face</Text>
                                <Text className="hub-mode-subtitle text-primary/70">Duel · un ami ou un profil de démonstration</Text>
                            </View>
                            <Text className="hub-mode-arrow">→</Text>
                        </Pressable>
                    </HardShadowCard>

                    <HardShadowCard borderRadius={20} offsetY={4} className="hub-mode-card hub-mode-card-half bg-plateau-violet" style={{width: "47%"}}>
                        <Text className="hub-mode-icon">🎯</Text>
                        <View>
                            <Text className="hub-mode-title text-plateau-cream">Solo</Text>
                            <Text className="hub-mode-subtitle text-plateau-cream/70">Bientôt disponible</Text>
                        </View>
                    </HardShadowCard>

                    <HardShadowCard borderRadius={20} offsetY={4} className="hub-mode-card hub-mode-card-half bg-plateau-cyan" style={{width: "47%"}}>
                        <Text className="hub-mode-icon">🏟️</Text>
                        <View>
                            <Text className="hub-mode-title text-primary">Plateau</Text>
                            <Text className="hub-mode-subtitle text-primary/70">Bientôt disponible</Text>
                        </View>
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

            <NewMatchModal
                visible={isNewMatchModalVisible}
                onClose={() => setNewMatchModalVisible(false)}
                onInviteFriend={handleInviteFriend}
                onRandomOpponent={handleRandomOpponent}
            />
        </SafeAreaView>
    );
};

export default Joute;
