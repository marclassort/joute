import {Pressable, Text, View} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {Category} from "@/game/types";
import {CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS} from "@/features/joute/constants";
import HardShadowCard from "@/features/joute/components/HardShadowCard";

export interface ThemeCardProps {
    category: Category;
    masteryPercent: number | null;
    selected: boolean;
    onPress: () => void;
}

const ThemeCard = ({category, masteryPercent, selected, onPress}: ThemeCardProps) => (
    <HardShadowCard
        borderRadius={18}
        offsetY={4}
        className={clsx("solo-theme-card", selected && "solo-theme-card-selected")}
        style={{backgroundColor: CATEGORY_COLORS[category]}}
    >
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Thème ${CATEGORY_LABELS[category]}`}
            accessibilityState={{selected}}
        >
            <Text className="solo-theme-icon">{CATEGORY_ICONS[category]}</Text>
            <Text className="solo-theme-label">{CATEGORY_LABELS[category]}</Text>
            <View className="solo-theme-progress-track">
                <View className="solo-theme-progress-fill" style={{width: `${masteryPercent ?? 0}%`}} />
            </View>
            <Text className="solo-theme-progress-label">
                {masteryPercent === null ? "Pas encore joué" : `${masteryPercent} % de réussite`}
            </Text>
        </Pressable>
    </HardShadowCard>
);

export default ThemeCard;
