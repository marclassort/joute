import React from "react";
import {useLocalSearchParams} from "expo-router";
import PlateauBoardScreen from "@/features/plateau/screens/PlateauBoardScreen";

export default function PlateauMatch() {
    const {id} = useLocalSearchParams<{id: string}>();
    return <PlateauBoardScreen matchId={id} />;
}
