import React from "react";
import {useLocalSearchParams} from "expo-router";
import JoinMatchScreen from "@/features/joute/screens/JoinMatchScreen";

const MatchDeepLinkRoute = () => {
    const {code} = useLocalSearchParams<{code: string}>();
    return <JoinMatchScreen code={code} />;
};

export default MatchDeepLinkRoute;
