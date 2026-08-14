import {StyleProp, View, ViewStyle} from "react-native";
import React, {ReactNode} from "react";
import {plateauColors} from "@/constants/theme";

export interface ShadowCardProps {
    children: ReactNode;
    /** Rayon de bordure en px, appliqué à la carte (les classes NativeWind ne définissent pas de rounded-*). */
    borderRadius: number;
    className?: string;
    style?: StyleProp<ViewStyle>;
}

/** Ombre douce façon système graphique v2 (0 2px 10px rgba(20,18,31,.06)) via les props shadow natifs. */
const ShadowCard = ({children, borderRadius, className, style}: ShadowCardProps) => (
    <View
        className={className}
        style={[
            {
                borderRadius,
                shadowColor: plateauColors.ink,
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 3,
            },
            style,
        ]}
    >
        {children}
    </View>
);

export default ShadowCard;
