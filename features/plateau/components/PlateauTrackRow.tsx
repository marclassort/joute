import {Image, Text, View} from "react-native";
import React from "react";
import {PLATEAU_WINNING_SCORE, Player} from "@/game/types";

export interface PlateauTrackRowProps {
    player: Player;
    score: number;
    color: string;
    isMe: boolean;
}

const PlateauTrackRow = ({player, score, color, isMe}: PlateauTrackRowProps) => {
    const percent = Math.min(100, Math.round((score / PLATEAU_WINNING_SCORE) * 100));

    return (
        <View className="plateau-track-row">
            {player.avatarUrl ? (
                <Image source={{uri: player.avatarUrl}} className="plateau-track-avatar" style={isMe ? {borderColor: color} : undefined} />
            ) : (
                <View
                    className="plateau-track-avatar"
                    style={{backgroundColor: color, borderColor: isMe ? color : "transparent"}}
                />
            )}
            <View className="plateau-track-bar-track">
                <View className="plateau-track-bar-fill" style={{width: `${percent}%`, backgroundColor: color}} />
                <View className="plateau-track-bar-knob" style={{left: `${percent}%`, marginLeft: -11, backgroundColor: color}} />
            </View>
            <Text className="plateau-track-score" style={{color}}>
                {score}
            </Text>
        </View>
    );
};

export default PlateauTrackRow;
