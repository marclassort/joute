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
    <View className="joute-players-row">
        <View className="joute-players-side">
            {me.avatarUrl ? <Image source={{uri: me.avatarUrl}} className="joute-players-avatar" /> : <View className="joute-players-avatar bg-muted" />}
            <Text className="joute-players-name" numberOfLines={1}>
                {me.displayName}
            </Text>
        </View>

        <Text className="joute-players-score">
            {myScore} - {opponentScore}
        </Text>

        <View className="joute-players-side">
            {opponent.avatarUrl ? (
                <Image source={{uri: opponent.avatarUrl}} className="joute-players-avatar" />
            ) : (
                <View className="joute-players-avatar bg-muted" />
            )}
            <Text className="joute-players-name" numberOfLines={1}>
                {opponent.displayName}
            </Text>
        </View>
    </View>
);

export default PlayersScoreRow;
