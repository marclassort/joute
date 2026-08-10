import React from "react";
import {useLocalSearchParams} from "expo-router";
import MatchScreen from "@/features/joute/screens/MatchScreen";

const JouteMatchRoute = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    return <MatchScreen matchId={id} />;
};

export default JouteMatchRoute;
