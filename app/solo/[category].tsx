import React from "react";
import {Redirect, useLocalSearchParams} from "expo-router";
import {DRAWABLE_CATEGORIES} from "@/game/rules";
import SoloScreen from "@/features/solo/screens/SoloScreen";

export default function SoloCategory() {
    const {category} = useLocalSearchParams<{category: string}>();

    const isValid = (DRAWABLE_CATEGORIES as readonly string[]).includes(category);
    if (!isValid) return <Redirect href="/solo" />;

    return <SoloScreen category={category as (typeof DRAWABLE_CATEGORIES)[number]} />;
}
