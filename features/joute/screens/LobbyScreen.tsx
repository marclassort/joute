import {Pressable, ScrollView, Share, Text, View} from "react-native";
import React from "react";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {createMatch} from "@/game/engine";
import {computeMatchStats} from "@/game/rules";
import {Player, WINNING_SCORE} from "@/game/types";
import {plateauColors} from "@/constants/theme";
import ghosts from "@/data/ghosts";
import {generateId} from "@/lib/utils";
import {buildInvitationLink, generateInvitationCode} from "@/services/invitations";
import {localInvitationRepository} from "@/services/localInvitationRepository";
import {localNotificationService} from "@/services/localNotificationService";
import {useMatches} from "../hooks/useMatches";
import {useCurrentPlayer} from "../hooks/useCurrentPlayer";
import ShadowCard from "@/components/ShadowCard";
import PrimaryButton from "@/components/PrimaryButton";

const SafeAreaView = styled(RNSafeAreaView);

const LobbyScreen = () => {
    const router = useRouter();
    const {id: myId, displayName, avatarUrl} = useCurrentPlayer();
    const {matches, saveMatch} = useMatches();
    const stats = computeMatchStats(matches, myId);

    const maybeRequestNotificationPermission = async () => {
        if (matches.length === 0) {
            try {
                await localNotificationService.requestPermission();
            } catch {
                // Ignoré volontairement : les notifications sont un confort, jamais un chemin critique.
            }
        }
    };

    const handleRandomOpponent = async () => {
        if (!myId) return;

        const ghost = ghosts[Math.floor(Math.random() * ghosts.length)];
        const me: Player = {id: myId, displayName, avatarUrl: avatarUrl ?? null, isGhost: false};
        const opponent: Player = {id: ghost.id, displayName: ghost.displayName, avatarUrl: ghost.avatarUrl, isGhost: true};

        const match = createMatch({id: generateId("match"), players: [me, opponent]});
        await saveMatch(match);
        await maybeRequestNotificationPermission();
        router.replace(`/joute/${match.id}`);
    };

    const handleInviteFriend = async () => {
        if (!myId) return;

        const code = generateInvitationCode();
        const me: Player = {id: myId, displayName, avatarUrl: avatarUrl ?? null, isGhost: false};
        const placeholder: Player = {id: code, displayName: "En attente…", avatarUrl: null, isGhost: false};

        const match = createMatch({id: generateId("match"), players: [me, placeholder], invitationCode: code, status: "pending"});
        await localInvitationRepository.create({code, matchId: match.id, creatorId: myId, createdAt: Date.now(), usedByPlayerId: null});
        await saveMatch(match);
        await maybeRequestNotificationPermission();

        try {
            await Share.share({message: `Rejoins mon défi Joute ! ${buildInvitationLink(code)}`});
        } catch {
            // Partage annulé ou indisponible : la partie reste visible dans « En attente » pour repartager plus tard.
        }
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <View className="duel-lobby-header">
                <Pressable className="duel-lobby-back-button" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="duel-lobby-back-icon">←</Text>
                </Pressable>
                <Text className="duel-lobby-header-title">Face-à-face</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
                <View className="duel-lobby-stats-card">
                    <View className="duel-lobby-stat">
                        <Text className="font-display text-lg" style={{color: plateauColors.teal}}>
                            {stats.wins}
                        </Text>
                        <Text className="duel-lobby-stat-label">Victoires</Text>
                    </View>
                    <View className="duel-lobby-stat">
                        <Text className="font-display text-lg text-plateau-paper">{stats.losses}</Text>
                        <Text className="duel-lobby-stat-label">Défaites</Text>
                    </View>
                    <View className="duel-lobby-stat">
                        <Text className="font-display text-lg" style={{color: plateauColors.brass}}>
                            {stats.currentStreak}
                        </Text>
                        <Text className="duel-lobby-stat-label">Série</Text>
                    </View>
                </View>

                <Text className="duel-lobby-rule-heading">Règle de la joute</Text>
                <ShadowCard borderRadius={18} className="duel-lobby-rule-card">
                    <View className="duel-lobby-rule-badge">
                        <Text className="duel-lobby-rule-badge-text">{WINNING_SCORE}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="duel-lobby-rule-title">{WINNING_SCORE} points gagnants</Text>
                        <Text className="duel-lobby-rule-subtitle">Le premier à {WINNING_SCORE} remporte la joute</Text>
                    </View>
                </ShadowCard>
            </ScrollView>

            <View className="duel-lobby-actions">
                <PrimaryButton title="Adversaire aléatoire" onPress={handleRandomOpponent} />
                <Pressable className="duel-lobby-secondary-button" onPress={handleInviteFriend} accessibilityRole="button">
                    <Text className="duel-lobby-secondary-text">Inviter un ami</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

export default LobbyScreen;
