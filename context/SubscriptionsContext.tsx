import React, {createContext, ReactNode, useContext, useState} from "react";
import {HOME_SUBSCRIPTIONS} from "@/constants/data";

interface SubscriptionsContextValue {
    subscriptions: Subscription[];
    addSubscription: (subscription: Subscription) => void;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | undefined>(undefined);

export const SubscriptionsProvider = ({children}: { children: ReactNode }) => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);

    const addSubscription = (subscription: Subscription) => {
        setSubscriptions((current) => [subscription, ...current]);
    };

    return (
        <SubscriptionsContext.Provider value={{subscriptions, addSubscription}}>
            {children}
        </SubscriptionsContext.Provider>
    );
};

export const useSubscriptions = () => {
    const context = useContext(SubscriptionsContext);
    if (!context) {
        throw new Error("useSubscriptions must be used within a SubscriptionsProvider");
    }
    return context;
};
