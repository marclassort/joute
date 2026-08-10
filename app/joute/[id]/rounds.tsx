import React from "react";
import {useLocalSearchParams} from "expo-router";
import RoundsScreen from "@/features/joute/screens/RoundsScreen";

const JouteRoundsRoute = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    return <RoundsScreen matchId={id} />;
};

export default JouteRoundsRoute;
