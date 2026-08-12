import {StyleProp, View, ViewStyle} from "react-native";
import React, {ReactNode} from "react";
import {plateauColors} from "@/constants/theme";

export interface HardShadowCardProps {
    children: ReactNode;
    /** Rayon de bordure en px, appliqué à l'ombre et à la carte pour qu'ils correspondent exactement. */
    borderRadius: number;
    offsetX?: number;
    offsetY?: number;
    shadowColor?: string;
    className?: string;
    style?: StyleProp<ViewStyle>;
}

/**
 * Reproduit un box-shadow dur façon "plateau de jeu" (offset plein, sans flou), que React Native ne
 * supporte pas nativement : un calque plein positionné derrière la carte, décalé de (offsetX, offsetY).
 */
const HardShadowCard = ({
    children,
    borderRadius,
    offsetX = 0,
    offsetY = 4,
    shadowColor = plateauColors.ink,
    className,
    style,
}: HardShadowCardProps) => (
    <View style={[{marginRight: offsetX, marginBottom: offsetY}, style]}>
        <View
            style={{
                position: "absolute",
                top: offsetY,
                left: offsetX,
                right: -offsetX,
                bottom: -offsetY,
                backgroundColor: shadowColor,
                borderRadius,
            }}
        />
        <View className={className} style={{borderRadius}}>
            {children}
        </View>
    </View>
);

export default HardShadowCard;
