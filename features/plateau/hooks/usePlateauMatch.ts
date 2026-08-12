import {useMemo} from "react";
import {usePlateauMatchesContext} from "../context/PlateauMatchesContext";

export function usePlateauMatch(matchId: string) {
    const {matches, isLoading, saveMatch} = usePlateauMatchesContext();
    const match = useMemo(() => matches.find((candidate) => candidate.id === matchId) ?? null, [matches, matchId]);
    return {match, isLoading, saveMatch};
}
