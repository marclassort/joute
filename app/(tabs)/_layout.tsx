import { useAuth } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasSeenOnboarding } from "@/services/guestIdentity";
import {components, layout, plateauColors} from "@/constants/theme";
import { tabs } from "@/constants/data";
import TabBarButton from "@/components/TabBarButton";
import ProfileSheet from "@/components/ProfileSheet";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {useMatches} from "@/features/joute/hooks/useMatches";

const tabBar = components.tabBar;

const TabLayout = () => {
        const insets = useSafeAreaInsets();
        const { isLoaded } = useAuth();
        const { id: myId } = useCurrentPlayer();
        const { matches } = useMatches();
        const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
        const [sheetVisible, setSheetVisible] = useState(false);

        useEffect(() => {
            hasSeenOnboarding().then(setOnboardingSeen);
        }, []);

        const toPlayCount = useMemo(
            () => matches.filter((match) => match.status === "active" && match.currentTurnPlayerId === myId).length,
            [matches, myId],
        );

        // Tous les onglets sont accessibles sans connexion — seul l'écran d'accueil doit avoir été vu une fois.
        if (!isLoaded || onboardingSeen === null) return null;

        if (!onboardingSeen) {
            return <Redirect href="/onboarding" />;
        }

        return (
            <View style={{flex: 1}}>
                <Tabs
                    screenOptions={{
                            headerShown: false,
                            tabBarStyle: {
                                    position: "absolute",
                                    bottom: Math.max(insets.bottom, layout.screenEdge),
                                    height: tabBar.height,
                                    marginHorizontal: tabBar.horizontalInset,
                                    paddingHorizontal: 7,
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                    borderRadius: tabBar.radius,
                                    backgroundColor: plateauColors.ink,
                                    borderWidth: 1,
                                    borderColor: "rgba(246,240,230,0.1)",
                                    elevation: 8,
                                    shadowColor: plateauColors.ink,
                                    shadowOffset: {width: 0, height: 14},
                                    shadowOpacity: 0.42,
                                    shadowRadius: 34,
                            },
                    }}
                >
                        {tabs.map((tab) => (
                            <Tabs.Screen
                                key={tab.name}
                                name={tab.name}
                                options={{
                                        title: tab.title,
                                        tabBarButton: (props) => (
                                            <TabBarButton
                                                {...props}
                                                icon={tab.icon}
                                                title={tab.title}
                                                badge={tab.name === "profile" ? toPlayCount : undefined}
                                            />
                                        ),
                                }}
                                listeners={tab.name === "profile" ? {
                                    tabPress: (e) => {
                                        e.preventDefault();
                                        setSheetVisible((visible) => !visible);
                                    },
                                } : undefined}
                            />
                        ))}
                        <Tabs.Screen name="settings" options={{ href: null }} />
                        <Tabs.Screen name="joute" options={{ href: null }} />
                </Tabs>
                <ProfileSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
            </View>
        );
};

export default TabLayout;
