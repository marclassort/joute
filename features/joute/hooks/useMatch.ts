import {useMemo} from "react";
import {useMatchesContext} from "../context/MatchesContext";

export function useMatch(matchId: string) {
    const {matches, isLoading, saveMatch} = useMatchesContext();
    const match = useMemo(() => matches.find((candidate) => candidate.id === matchId) ?? null, [matches, matchId]);
    return {match, isLoading, saveMatch};
}
