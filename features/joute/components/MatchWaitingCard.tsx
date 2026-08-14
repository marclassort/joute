import {Pressable, Text, View} from "react-native";
import React, {ReactNode, useEffect} from "react";
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from "react-native-reanimated";
import {Player, WINNING_SCORE} from "@/game/types";
import {plateauColors} from "@/constants/theme";
import ShadowCard from "@/components/ShadowCard";
import PlayersScoreRow from "./PlayersScoreRow";

export interface MatchWaitingCardProps {
    me: Player;
    opponent: Player;
    myScore: number;
    opponentScore: number;
    label: string;
    meta?: string;
    onBackHome: () => void;
    children?: ReactNode;
}

const MatchWaitingCard = ({me, opponent, myScore, opponentScore, label, meta, onBackHome, children}: MatchWaitingCardProps) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(12);

    useEffect(() => {
        opacity.value = withTiming(1, {duration: 350});
        translateY.value = withTiming(0, {duration: 350});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{translateY: translateY.value}],
    }));

    return (
        <Animated.View style={animatedStyle} className="flex-1">
            <Text className="duel-waiting-label">{label}</Text>

            <View className="mt-6">
                <PlayersScoreRow me={me} opponent={opponent} myScore={myScore} opponentScore={opponentScore} />
            </View>

            <View className="duel-waiting-progress-row">
                {Array.from({length: WINNING_SCORE}).map((_, index) => (
                    <View
                        key={index}
                        className="hub-hero-progress-seg"
                        style={{backgroundColor: index < myScore ? plateauColors.teal : "rgba(255,253,248,0.15)"}}
                    />
                ))}
            </View>

            {meta && <Text className="duel-waiting-meta">{meta}</Text>}

            <View className="mt-auto gap-3 pt-6">
                {children}
                <ShadowCard borderRadius={20} className="solo-cta-button">
                    <Pressable onPress={onBackHome} accessibilityRole="button">
                        <Text className="solo-cta-text">Retour à l&#39;accueil</Text>
                    </Pressable>
                </ShadowCard>
            </View>
        </Animated.View>
    );
};

export default MatchWaitingCard;
