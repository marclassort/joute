import React from "react";
import {View} from "react-native";

const LINE_SPACING = 13;
const LINE_COUNT = 70;
const LINE_COLOR = "rgba(246,240,230,0.05)";

export interface InkPatternProps {
    className?: string;
}

/**
 * Motif signature de la charte v2 (project-update/) : hachures à 58°, 1px, opacité 5%,
 * réservées aux fonds encre (héros d'accueil, manche, résultat, premium, en-tête de profil).
 * Le parent doit être `position: relative` + `overflow: hidden`.
 * Implémenté avec des Views pivotées (pas de repeating-linear-gradient en RN) pour éviter
 * une dépendance SVG — voir tableau d'exceptions StyleSheet de AGENTS.md ("tableaux de transform").
 */
const InkPattern = ({className}: InkPatternProps) => (
    <View pointerEvents="none" className={className} style={{position: "absolute", inset: 0, overflow: "hidden"}}>
        {Array.from({length: LINE_COUNT}).map((_, index) => (
            <View
                key={index}
                style={{
                    position: "absolute",
                    top: -500,
                    left: index * LINE_SPACING - 500,
                    width: 1,
                    height: 1600,
                    backgroundColor: LINE_COLOR,
                    transform: [{rotate: "58deg"}],
                }}
            />
        ))}
    </View>
);

export default InkPattern;
