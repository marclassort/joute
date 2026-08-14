import React from "react";
import {Pressable, PressableProps} from "react-native";
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends PressableProps {
    /** Échelle appliquée pendant l'appui — 0.96 par défaut, plus marqué (0.94) pour les gros CTA. */
    activeScale?: number;
}

/** Retour tactile v2 (project-update/) : léger effet d'échelle au press, sur les éléments cliquables clés
 * (CTA, cartes de choix, onglets). Garder discret — pas d'usage systématique sur chaque Pressable de l'app. */
const PressableScale = ({activeScale = 0.96, style, onPressIn, onPressOut, ...props}: PressableScaleProps) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{scale: scale.value}],
    }));

    return (
        <AnimatedPressable
            {...props}
            style={[style, animatedStyle]}
            onPressIn={(event) => {
                scale.value = withTiming(activeScale, {duration: 90});
                onPressIn?.(event);
            }}
            onPressOut={(event) => {
                scale.value = withTiming(1, {duration: 120});
                onPressOut?.(event);
            }}
        />
    );
};

export default PressableScale;
