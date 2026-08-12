import {Pressable, Text} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";

export interface ThemeFilterChipProps {
    label: string;
    active: boolean;
    onPress: () => void;
}

const ThemeFilterChip = ({label, active, onPress}: ThemeFilterChipProps) => (
    <Pressable
        className={clsx("solo-filter-chip", active && "solo-filter-chip-active")}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{selected: active}}
    >
        <Text className={clsx("solo-filter-chip-text", active && "solo-filter-chip-text-active")}>{label}</Text>
    </Pressable>
);

export default ThemeFilterChip;
