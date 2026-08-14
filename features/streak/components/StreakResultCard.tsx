import {Pressable, Text, View} from "react-native";
import React from "react";
import ShadowCard from "@/components/ShadowCard";

export interface StreakResultCardProps {
    finalStreak: number;
    bestStreak: number;
    xpEarned: number;
    onReplay: () => void;
    onBackToHub: () => void;
}

function headingFor(streak: number): string {
    if (streak >= 10) return "Série\nlégendaire !";
    if (streak >= 5) return "Belle\nsérie !";
    return "Bien tenté,\ncontinue !";
}

const StreakResultCard = ({finalStreak, bestStreak, xpEarned, onReplay, onBackToHub}: StreakResultCardProps) => (
    <View>
        <Text className="streak-result-title">4 à la suite · partie terminée</Text>
        <Text className="streak-result-heading">{headingFor(finalStreak)}</Text>

        <View className="streak-result-score-card">
            <Text className="streak-result-score">{finalStreak}</Text>
            <Text className="streak-result-score-label">bonnes réponses d&#39;affilée</Text>
            {finalStreak >= bestStreak && finalStreak > 0 && <Text className="streak-result-best-pill">🏆 Nouveau record</Text>}
            <Text className="streak-result-xp-pill">+{xpEarned} XP</Text>
        </View>

        <View className="streak-result-actions">
            <ShadowCard borderRadius={20} className="solo-cta-button">
                <Pressable onPress={onReplay} accessibilityRole="button">
                    <Text className="solo-cta-text">Rejouer</Text>
                </Pressable>
            </ShadowCard>
            <Pressable className="streak-result-secondary-button" onPress={onBackToHub} accessibilityRole="button">
                <Text className="streak-result-secondary-text">Retour aux modes</Text>
            </Pressable>
        </View>
    </View>
);

export default StreakResultCard;
