import {useCallback, useEffect, useState} from "react";
import {getPremiumState, PremiumPlan, PremiumState, setPremiumPlan, subscribeToPremium} from "@/lib/premium";

const DEFAULT_STATE: PremiumState = {isPremium: false, plan: "annual"};

/** Statut Premium, persisté localement (voir lib/premium.ts). */
export function usePremium() {
    const [state, setState] = useState<PremiumState>(DEFAULT_STATE);

    useEffect(() => {
        getPremiumState().then(setState);
    }, []);

    const selectPlan = useCallback((plan: PremiumPlan) => {
        setState((current) => ({...current, plan}));
        setPremiumPlan(plan);
    }, []);

    const subscribe = useCallback(() => {
        subscribeToPremium().then(setState);
    }, []);

    return {...state, selectPlan, subscribe};
}
