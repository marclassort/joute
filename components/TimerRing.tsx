import React, {ReactNode} from "react";
import {View} from "react-native";
import Svg, {Circle} from "react-native-svg";
import Animated, {SharedValue, useAnimatedProps} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface TimerRingProps {
    size: number;
    strokeWidth?: number;
    /** 1 = temps plein, 0 = expiré. */
    progress: SharedValue<number>;
    trackColor: string;
    activeColor: string;
    children?: ReactNode;
}

/** Anneau de chrono de la charte v2 (project-update/) : conique, tourne au rose sous 4s (voir couleur passée par l'appelant). */
const TimerRing = ({size, strokeWidth = 6, progress, trackColor, activeColor, children}: TimerRingProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    return (
        <View style={{width: size, height: size, alignItems: "center", justifyContent: "center"}}>
            <Svg width={size} height={size} style={{position: "absolute", transform: [{rotate: "-90deg"}]}}>
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={activeColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    animatedProps={animatedProps}
                />
            </Svg>
            {children}
        </View>
    );
};

export default TimerRing;
