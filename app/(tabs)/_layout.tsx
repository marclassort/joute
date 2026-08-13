import { useAuth } from "@clerk/expo";
import { Redirect, Tabs, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasSeenOnboarding } from "@/services/guestIdentity";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {components, plateauColors} from "@/constants/theme";
import { tabs } from "@/constants/data";
import TabBarIcon from "@/components/TabBarIcon";

const tabBar = components.tabBar;

const TabIcon = ({ focused, icon }: TabIconProps) => (
    <View className={clsx("tabs-icon-pill", focused && "tabs-icon-pill-active")}>
        <TabBarIcon name={icon} color={focused ? plateauColors.ink : "rgba(246,240,230,0.62)"} />
    </View>
);

const TabLabel = ({ focused, title }: { focused: boolean; title: string }) => (
    <Text
        className={clsx("tabs-label", focused && "tabs-label-active")}
        numberOfLines={1}
        adjustsFontSizeToFit
    >
        {title}
    </Text>
);

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
                                borderRadius: tabBar.radius,
                                backgroundColor: plateauColors.ink,
                                borderTopWidth: 0,
                                elevation: 8,
                                shadowColor: plateauColors.ink,
                                shadowOffset: {width: 0, height: 14},
                                shadowOpacity: 0.42,
                                shadowRadius: 34,
                        },
                        tabBarItemStyle: {
                                height: "100%",
                                justifyContent: "center",
                        },
                }}
            >
                    {tabs.map((tab) => (
                        <Tabs.Screen
                            key={tab.name}
                            name={tab.name}
                            options={{
                                    title: tab.title,
                                    tabBarIcon: ({ focused }) => (
                                        <TabIcon focused={focused} icon={tab.icon} />
                                    ),
                                    tabBarLabel: ({ focused }) => (
                                        <TabLabel focused={focused} title={tab.title} />
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