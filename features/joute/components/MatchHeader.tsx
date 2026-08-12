import {Pressable, Text, View} from "react-native";
import React from "react";

export interface MatchHeaderProps {
    title: string;
    onBack: () => void;
}

const MatchHeader = ({title, onBack}: MatchHeaderProps) => (
    <View className="duel-header">
        <Pressable className="duel-close-button" onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour">
            <Text className="duel-close-icon">←</Text>
        </Pressable>
        <Text className="duel-header-title">{title}</Text>
        <View className="size-9" />
    </View>
);

export default MatchHeader;
