import {Pressable, Text, View} from "react-native";
import React from "react";
import {Category} from "@/game/types";
import {CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS} from "../constants";

export interface CategoryChoiceStepProps {
    options: Category[];
    roundNumber: number;
    onChoose: (category: Category) => void;
}

const CategoryChoiceStep = ({options, roundNumber, onChoose}: CategoryChoiceStepProps) => {
    return (
        <View className="gap-5">
            <View>
                <Text className="duel-step-heading">Manche {roundNumber}</Text>
                <Text className="duel-step-subheading">Choisis un thème</Text>
            </View>

            <View className="gap-3">
                {options.map((category) => (
                    <Pressable
                        key={category}
                        className="duel-category-card"
                        style={{backgroundColor: CATEGORY_COLORS[category]}}
                        onPress={() => onChoose(category)}
                        accessibilityRole="button"
                        accessibilityLabel={`Choisir le thème ${CATEGORY_LABELS[category]}`}
                    >
                        <Text className="duel-category-icon">{CATEGORY_ICONS[category]}</Text>
                        <Text className="duel-category-label">{CATEGORY_LABELS[category]}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

export default CategoryChoiceStep;
