import { useAuth } from "@clerk/expo";
import { Redirect, Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasSeenOnboarding } from "@/services/guestIdentity";
import {components, plateauColors} from "@/constants/theme";
import { tabs } from "@/constants/data";
import TabBarButton from "@/components/TabBarButton";

const tabBar = components.tabBar;

const TabLayout = () => {
        const insets = useSafeAreaInsets();
        const router = useRouter();
        const { isLoaded } = useAuth();
        const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

        useEffect(() => {
            hasSeenOnboarding().then(setOnboardingSeen);
        }, []);

        // Tous les onglets sont accessibles sans connexion — seul l'écran d'accueil doit avoir été vu une fois.
        if (!isLoaded || onboardingSeen === null) return null;

        if (!onboardingSeen) {
            return <Redirect href="/onboarding" />;
        }

        return (
            <Tabs
                screenOptions={{
                        headerShown: false,
                        tabBarStyle: {
                                position: "absolute",
                                bottom: Math.max(insets.bottom, tabBar.horizontalInset),
                                height: tabBar.height,
                                marginHorizontal: tabBar.horizontalInset,
                                paddingHorizontal: 7,
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
                                        <TabBarButton {...props} icon={tab.icon} title={tab.title} />
                                    ),
                            }}
                            listeners={tab.name === "profile" ? {
                                tabPress: (e) => {
                                    e.preventDefault();
                                    router.push("/profile-modal");
                                },
                            } : undefined}
                        />
                    ))}
                    <Tabs.Screen name="settings" options={{ href: null }} />
                    <Tabs.Screen name="joute" options={{ href: null }} />
            </Tabs>
        );
};

export default TabLayout;
