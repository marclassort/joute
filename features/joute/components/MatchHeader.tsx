import {Image, Pressable, Text, View} from "react-native";
import React from "react";
import {icons} from "@/constants/icons";

export interface MatchHeaderProps {
    title: string;
    onBack: () => void;
}

const MatchHeader = ({title, onBack}: MatchHeaderProps) => (
    <View className="joute-match-header">
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Retour">
            <Image source={icons.back} className="joute-back-icon" />
        </Pressable>
        <Text className="joute-match-header-title">{title}</Text>
        <View className="joute-back-icon" />
    </View>
);

export default MatchHeader;
