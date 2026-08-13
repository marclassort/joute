import React from "react";
import Svg, {Circle, Path, Rect} from "react-native-svg";

export type TabIconName = "play" | "quests" | "leaderboard" | "premium" | "profile";

export interface TabBarIconProps {
    name: TabIconName;
    color: string;
    size?: number;
}

/** Icônes de la barre d'onglets, charte v2 (project-update/ · "Composants clés") — tracés SVG plutôt qu'emoji,
 * pour ne pas dépendre d'une police d'emoji couleur installée sur l'appareil. */
const TabBarIcon = ({name, color, size = 22}: TabBarIconProps) => {
    switch (name) {
        case "play":
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M8 5.6v12.8L19 12 8 5.6Z" fill={color} />
                </Svg>
            );
        case "quests":
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M13.2 2.8 5.6 13.2h5.2l-.8 8 7.6-10.4h-5.2l.8-8Z" fill={color} />
                </Svg>
            );
        case "leaderboard":
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Rect x={3.5} y={12} width={4.6} height={8.5} rx={1.6} fill={color} />
                    <Rect x={9.7} y={4.5} width={4.6} height={16} rx={1.6} fill={color} />
                    <Rect x={15.9} y={9} width={4.6} height={11.5} rx={1.6} fill={color} />
                </Svg>
            );
        case "premium":
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M3.4 7.4 7.2 11l4.8-6.6L16.8 11l3.8-3.6-1.6 11.2H5L3.4 7.4Z" fill={color} />
                </Svg>
            );
        case "profile":
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={8.4} r={3.9} fill={color} />
                    <Path d="M4.6 20.4c0-4.1 3.3-6.6 7.4-6.6s7.4 2.5 7.4 6.6H4.6Z" fill={color} />
                </Svg>
            );
        default:
            return null;
    }
};

export default TabBarIcon;
