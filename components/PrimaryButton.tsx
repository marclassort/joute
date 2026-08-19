import {Text} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import ShadowCard from "./ShadowCard";
import PressableScale from "./PressableScale";

export interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    /** Rayon de bordure en px — 20 pour les CTA de jeu, 16 pour les formulaires compacts (auth, profil). */
    borderRadius?: number;
    accessibilityLabel?: string;
}

/**
 * CTA principal partagé par tous les écrans (Solo/Duel/Un seul gagnant/Auth/Profil). `PressableScale`
 * couvre toute la largeur du bouton (pas juste le texte) : dans le composant `ShadowCard` parent qui
 * centre son contenu (`items-center`), un Pressable sans largeur explicite se réduit à la taille de son
 * texte et laisse tout le reste du bouton visuellement présent mais tactilement inerte.
 */
const PrimaryButton = ({title, onPress, disabled, borderRadius = 20, accessibilityLabel}: PrimaryButtonProps) => (
    <ShadowCard borderRadius={borderRadius} className={clsx("solo-cta-button", disabled && "solo-cta-button-disabled")}>
        <PressableScale
            activeScale={0.94}
            className="w-full items-center"
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? title}
        >
            <Text className="solo-cta-text">{title}</Text>
        </PressableScale>
    </ShadowCard>
);

export default PrimaryButton;
