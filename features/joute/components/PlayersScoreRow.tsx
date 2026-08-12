import {Image, Text, View} from "react-native";
import React from "react";
import {Player} from "@/game/types";

export interface PlayersScoreRowProps {
    me: Player;
    opponent: Player;
    myScore: number;
    opponentScore: number;
}

const PlayersScoreRow = ({me, opponent, myScore, opponentScore}: PlayersScoreRowProps) => (
    <View className="duel-players-row">
        <View className="duel-players-side">
            {me.avatarUrl ? <Image source={{uri: me.avatarUrl}} className="duel-players-avatar" /> : <View className="duel-players-avatar" />}
            <Text className="duel-players-name" numberOfLines={1}>
                {me.displayName}
            </Text>
        </View>

        <Text className="duel-players-score">
            {myScore} - {opponentScore}
        </Text>

        <View className="duel-players-side">
            {opponent.avatarUrl ? (
                <Image source={{uri: opponent.avatarUrl}} className="duel-players-avatar" />
            ) : (
                <View className="duel-players-avatar" />
            )}
            <Text className="duel-players-name" numberOfLines={1}>
                {opponent.displayName}
            </Text>
        </View>
    </View>
);

export default PlayersScoreRow;
