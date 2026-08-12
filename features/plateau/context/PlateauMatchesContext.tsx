import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer} from "react";
import {PlateauMatch} from "@/game/types";
import {localPlateauMatchRepository} from "@/services/localPlateauMatchRepository";
import {playAvailableGhostTurns} from "@/services/plateauOpponentDriver";
import {ALL_QUESTIONS} from "@/data/questions";

/** Fait avancer les fantômes du plateau dont c'est l'heure de jouer. Calculé à la lecture, comme l'expiration côté duel. */
function reconcileMatch(match: PlateauMatch, now: number): PlateauMatch {
    if (match.status !== "active") return match;
    return playAvailableGhostTurns(match, ALL_QUESTIONS, now);
}

interface PlateauMatchesState {
    matches: Record<string, PlateauMatch>;
    isLoading: boolean;
}

type PlateauMatchesAction =
    | {type: "loading"}
    | {type: "loaded"; matches: PlateauMatch[]}
    | {type: "upsert"; match: PlateauMatch};

function reducer(state: PlateauMatchesState, action: PlateauMatchesAction): PlateauMatchesState {
    switch (action.type) {
        case "loading":
            return {...state, isLoading: true};
        case "loaded": {
            const matches: Record<string, PlateauMatch> = {};
            for (const match of action.matches) matches[match.id] = match;
            return {matches, isLoading: false};
        }
        case "upsert":
            return {...state, matches: {...state.matches, [action.match.id]: action.match}};
    }
}

interface PlateauMatchesContextValue {
    matches: PlateauMatch[];
    isLoading: boolean;
    refresh: () => Promise<void>;
    saveMatch: (match: PlateauMatch) => Promise<void>;
}

const PlateauMatchesContext = createContext<PlateauMatchesContextValue | undefined>(undefined);

export const PlateauMatchesProvider = ({children}: {children: ReactNode}) => {
    const [state, dispatch] = useReducer(reducer, {matches: {}, isLoading: true});

    const refresh = useCallback(async () => {
        dispatch({type: "loading"});
        const stored = await localPlateauMatchRepository.list();
        const now = Date.now();
        const reconciled = await Promise.all(
            stored.map(async (match) => {
                const next = reconcileMatch(match, now);
                if (next !== match) await localPlateauMatchRepository.save(next);
                return next;
            }),
        );
        dispatch({type: "loaded", matches: reconciled});
    }, []);

    const saveMatch = useCallback(async (match: PlateauMatch) => {
        await localPlateauMatchRepository.save(match);
        dispatch({type: "upsert", match});
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const value = useMemo<PlateauMatchesContextValue>(
        () => ({matches: Object.values(state.matches), isLoading: state.isLoading, refresh, saveMatch}),
        [state, refresh, saveMatch],
    );

    return <PlateauMatchesContext.Provider value={value}>{children}</PlateauMatchesContext.Provider>;
};

export function usePlateauMatchesContext(): PlateauMatchesContextValue {
    const context = useContext(PlateauMatchesContext);
    if (!context) {
        throw new Error("usePlateauMatchesContext doit être utilisé à l'intérieur d'un PlateauMatchesProvider");
    }
    return context;
}
