import {Pressable, Text, View} from "react-native";
import React from "react";
import {Category} from "@/game/types";
import {CATEGORY_LABELS} from "@/features/joute/constants";
import InkPattern from "@/components/InkPattern";
import PrimaryButton from "@/components/PrimaryButton";
import {SOLO_QUESTIONS_PER_SESSION} from "../constants";

export interface SoloResultCardProps {
    category: Category;
    score: number;
    xpEarned: number;
    averageResponseMs: number;
    longestCorrectStreak: number;
    onReplay: () => void;
    onBackToThemes: () => void;
}

function headingFor(score: number): string {
    if (score >= 9) return "Score parfait\nou presque !";
    if (score >= 6) return "Bien joué,\nchampion !";
    return "Continue,\ntu progresses !";
}

const SoloResultCard = ({category, score, xpEarned, averageResponseMs, longestCorrectStreak, onReplay, onBackToThemes}: SoloResultCardProps) => (
    <View className="relative overflow-hidden">
        <InkPattern />
        <Text className="solo-result-title">{CATEGORY_LABELS[category]} · partie terminée</Text>
        <Text className="solo-result-heading">{headingFor(score)}</Text>

        <View className="solo-result-score-card">
            <View className="flex-row items-baseline gap-1">
                <Text className="solo-result-score">{score}</Text>
                <Text className="solo-result-score-total">/{SOLO_QUESTIONS_PER_SESSION}</Text>
            </View>
            <Text className="solo-result-score-label">bonnes réponses</Text>
            <Text className="solo-result-xp-pill">+{xpEarned} XP</Text>
        </View>

        <View className="solo-result-stats-card">
            <View className="solo-result-stat-row">
                <Text className="solo-result-stat-label">Temps de réponse moyen</Text>
                <Text className="solo-result-stat-value">{(averageResponseMs / 1000).toFixed(1)} s</Text>
            </View>
            <View className="solo-result-stat-row">
                <Text className="solo-result-stat-label">Plus longue série</Text>
                <Text className="solo-result-stat-value">{longestCorrectStreak} bonnes</Text>
            </View>
        </View>

        <View className="solo-result-actions">
            <PrimaryButton title={`Rejouer · ${CATEGORY_LABELS[category]}`} onPress={onReplay} />
            <Pressable className="solo-result-secondary-button" onPress={onBackToThemes} accessibilityRole="button">
                <Text className="solo-result-secondary-text">Retour aux thèmes</Text>
            </Pressable>
        </View>
    </View>
);

export default SoloResultCard;
