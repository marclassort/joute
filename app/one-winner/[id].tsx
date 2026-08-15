import React from "react";
import {useLocalSearchParams} from "expo-router";
import OneWinnerGameScreen from "@/features/oneWinner/screens/OneWinnerGameScreen";

export default function OneWinnerGame() {
    const {id} = useLocalSearchParams<{id: string}>();
    return <OneWinnerGameScreen gameId={id} />;
}
