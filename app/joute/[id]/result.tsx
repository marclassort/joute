import React from "react";
import {useLocalSearchParams} from "expo-router";
import ResultScreen from "@/features/joute/screens/ResultScreen";

const JouteResultRoute = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    return <ResultScreen matchId={id} />;
};

export default JouteResultRoute;
