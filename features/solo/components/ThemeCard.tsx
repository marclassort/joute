import {Pressable, Text, View} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {Category} from "@/game/types";
import {CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_TINTS} from "@/features/joute/constants";

export interface ThemeCardProps {
    category: Category;
    masteryPercent: number | null;
    selected: boolean;
    onPress: () => void;
}

const ThemeCard = ({category, masteryPercent, selected, onPress}: ThemeCardProps) => (
    <Pressable
        className={clsx("solo-theme-card", selected && "solo-theme-card-selected")}
        style={{backgroundColor: CATEGORY_TINTS[category]}}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Thème ${CATEGORY_LABELS[category]}`}
        accessibilityState={{selected}}
    >
        <Text className="solo-theme-icon">{CATEGORY_ICONS[category]}</Text>
        <Text className="solo-theme-label" numberOfLines={2}>
            {CATEGORY_LABELS[category]}
        </Text>
        {masteryPercent !== null && <Text className="solo-theme-progress-label">{masteryPercent}%</Text>}
    </Pressable>
);

export default ThemeCard;
