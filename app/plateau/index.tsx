import React from "react";
import {Redirect} from "expo-router";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {usePlateauMatches} from "@/features/plateau/hooks/usePlateauMatches";

export default function PlateauIndex() {
    const {id: myId} = useCurrentPlayer();
    const {matches, isLoading} = usePlateauMatches();

    if (isLoading) return null;

    const ongoing = matches.find((match) => match.status === "active" && match.players.some((player) => player.id === myId));
    if (ongoing) return <Redirect href={`/plateau/${ongoing.id}`} />;

    return <Redirect href="/plateau/new" />;
}
