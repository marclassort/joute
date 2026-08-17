import React from "react";
import Svg, {Defs, Line, Pattern, Rect} from "react-native-svg";

/**
 * Fines hachures diagonales sur le fond du plateau, reprises du mockup Claude Design
 * (repeating-linear-gradient 58°, traits de 2px espacés de 13px, 5% d'opacité). Overlay absolu,
 * jamais interactif, posé derrière le contenu de l'écran de jeu.
 */
const OneWinnerHatchBackground = () => (
    <Svg style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0}} width="100%" height="100%" pointerEvents="none">
        <Defs>
            <Pattern id="one-winner-hatch" width={13} height={13} patternTransform="rotate(58)" patternUnits="userSpaceOnUse">
                <Line x1={0} y1={0} x2={0} y2={13} stroke="rgba(246,240,230,0.05)" strokeWidth={2} />
            </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#one-winner-hatch)" />
    </Svg>
);

export default OneWinnerHatchBackground;
