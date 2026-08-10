import {Pressable, Text, View} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {Answer} from "@/game/types";
import {CATEGORY_ICONS, CATEGORY_LABELS} from "../constants";
import {FlatQuestionEntry} from "../types";

export interface RoundRowProps {
    entries: FlatQuestionEntry[];
    chooserName: string;
    baseGlobalIndex: number;
    onPressQuestion: (globalIndex: number) => void;
}

const Pellet = ({answer, onPress}: {answer?: Answer; onPress: () => void}) => {
    const state = !answer ? "pending" : answer.isCorrect ? "correct" : "incorrect";
    const symbol = state === "pending" ? "—" : state === "correct" ? "✓" : "✕";
    return (
        <Pressable
            className={clsx(
                "joute-pellet",
                state === "correct" && "joute-pellet-correct",
                state === "incorrect" && "joute-pellet-incorrect",
                state === "pending" && "joute-pellet-pending",
            )}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={state === "correct" ? "Bonne réponse" : state === "incorrect" ? "Mauvaise réponse" : "Pas encore répondu"}
        >
            <Text className="joute-pellet-text">{symbol}</Text>
        </Pressable>
    );
};

const RoundRow = ({entries, chooserName, baseGlobalIndex, onPressQuestion}: RoundRowProps) => {
    const round = entries[0]?.round;
    if (!round) return null;

    return (
        <View className="joute-round-row">
            <View className="joute-round-header">
                <Text className="joute-round-theme">
                    {CATEGORY_ICONS[round.category]} {CATEGORY_LABELS[round.category]}
                </Text>
                <Text className="joute-round-chooser">Choisi par {chooserName}</Text>
            </View>

            <View className="joute-pellets-row">
                <Text className="joute-pellet-label">Toi</Text>
                {entries.map((entry, index) => (
                    <Pellet key={`mine-${entry.question.id}`} answer={entry.myAnswer} onPress={() => onPressQuestion(baseGlobalIndex + index)} />
                ))}
            </View>
            <View className="joute-pellets-row">
                <Text className="joute-pellet-label">Adv.</Text>
                {entries.map((entry, index) => (
                    <Pellet key={`opponent-${entry.question.id}`} answer={entry.opponentAnswer} onPress={() => onPressQuestion(baseGlobalIndex + index)} />
                ))}
            </View>
        </View>
    );
};

export default RoundRow;
