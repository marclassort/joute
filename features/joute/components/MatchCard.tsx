import {Image, Pressable, Text, View} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {Match, ROUNDS_PER_MATCH} from "@/game/types";
import {computeOutcomeForPlayer, computeScore} from "@/game/rules";
import {formatTimeRemaining, isExpiringSoon} from "@/lib/utils";

export type MatchCardVariant = "toPlay" | "waiting" | "finished";

export interface MatchCardProps {
    match: Match;
    viewerId: string;
    variant: MatchCardVariant;
    onPress: () => void;
}

function resultLabel(match: Match, viewerId: string): string {
    const outcome = computeOutcomeForPlayer(match, viewerId);
    if (outcome === null) return "Annulée";
    if (outcome === "draw") return "Match nul";
    const suffix = match.status === "expired" ? " (forfait)" : "";
    return outcome === "win" ? `Victoire${suffix}` : `Défaite${suffix}`;
}

const MatchCard = ({match, viewerId, variant, onPress}: MatchCardProps) => {
    const opponent = match.players.find((player) => player.id !== viewerId) ?? match.players[1];
    const me = match.players.find((player) => player.id === viewerId) ?? match.players[0];
    const roundLabel = `Manche ${Math.min(match.currentRoundIndex + 1, ROUNDS_PER_MATCH)} sur ${ROUNDS_PER_MATCH}`;
    const score = `${computeScore(match, viewerId)} - ${computeScore(match, opponent.id)}`;

    if (variant === "finished") {
        return (
            <Pressable className="joute-card" onPress={onPress}>
                <View className="joute-card-players-row">
                    {me.avatarUrl ? (
                        <Image source={{uri: me.avatarUrl}} className="joute-card-avatar" />
                    ) : (
                        <View className="joute-card-avatar" />
                    )}
                    <Text className="joute-card-vs">vs</Text>
                    {opponent.avatarUrl ? (
                        <Image source={{uri: opponent.avatarUrl}} className="joute-card-avatar" />
                    ) : (
                        <View className="joute-card-avatar" />
                    )}
                    <View className="joute-card-copy">
                        <Text className="joute-card-name" numberOfLines={1}>
                            {me.displayName} vs {opponent.displayName}
                        </Text>
                        <Text className="joute-card-meta">{resultLabel(match, viewerId)}</Text>
                    </View>
                    <Text className="joute-card-score">{score}</Text>
                </View>
            </Pressable>
        );
    }

    if (match.status === "pending") {
        return (
            <Pressable className="joute-card" onPress={onPress}>
                <View className="joute-card-row">
                    <View className="joute-card-avatar" />
                    <View className="joute-card-copy">
                        <Text className="joute-card-name" numberOfLines={1}>
                            Invitation envoyée
                        </Text>
                        <Text className="joute-card-meta">Code {match.invitationCode} · en attente qu&#39;un ami rejoigne</Text>
                    </View>
                </View>
            </Pressable>
        );
    }

    return (
        <Pressable className="joute-card" onPress={onPress}>
            <View className="joute-card-row">
                {opponent.avatarUrl ? (
                    <Image source={{uri: opponent.avatarUrl}} className="joute-card-avatar" />
                ) : (
                    <View className="joute-card-avatar" />
                )}
                <View className="joute-card-copy">
                    <Text className="joute-card-name" numberOfLines={1}>
                        {opponent.displayName}
                        {__DEV__ && opponent.isGhost ? " · démo" : ""}
                    </Text>
                    <Text className="joute-card-meta">{roundLabel}</Text>
                </View>
                <Text className="joute-card-score">{score}</Text>
            </View>
            <View className="joute-card-footer">
                <Text
                    className={clsx(
                        "joute-card-time",
                        variant === "toPlay" && isExpiringSoon(match.expiresAt) && "joute-card-time-alert",
                    )}
                >
                    {formatTimeRemaining(match.expiresAt)}
                </Text>
            </View>
        </Pressable>
    );
};

export default MatchCard;
