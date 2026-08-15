import React from "react";
import {useLocalSearchParams} from "expo-router";
import OneWinnerWaitingRoomScreen from "@/features/oneWinner/screens/OneWinnerWaitingRoomScreen";

export default function OneWinnerGame() {
    const {id} = useLocalSearchParams<{id: string}>();
    return <OneWinnerWaitingRoomScreen gameId={id} />;
}
