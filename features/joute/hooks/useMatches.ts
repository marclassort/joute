import {useMatchesContext} from "../context/MatchesContext";

export function useMatches() {
    const {matches, isLoading, refresh, saveMatch} = useMatchesContext();
    return {matches, isLoading, refresh, saveMatch};
}
