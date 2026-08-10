import {useMatchesContext} from "../context/MatchesContext";

export function useMatches() {
    const {matches, isLoading, refresh} = useMatchesContext();
    return {matches, isLoading, refresh};
}
