import {usePlateauMatchesContext} from "../context/PlateauMatchesContext";

export function usePlateauMatches() {
    const {matches, isLoading, refresh, saveMatch} = usePlateauMatchesContext();
    return {matches, isLoading, refresh, saveMatch};
}
