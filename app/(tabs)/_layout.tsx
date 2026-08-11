import { useAuth } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";
import { Image, View, type ImageSourcePropType } from "react-native";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasSeenOnboarding } from "@/services/guestIdentity";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {colors, components} from "@/constants/theme";
import { tabs } from "@/constants/data";

const tabBar = components.tabBar;

const TabIcon = ({ focused, icon }: TabIconProps) => (
    <View className="tabs-icon">
            <View className={clsx("tabs-pill", focused && "tabs-active")}>
                    <Image source={icon} resizeMode="contain" className="tabs-glyph" />
            </View>
    </View>
);

const TabLayout = () => {
        const insets = useSafeAreaInsets();
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
                        tabBarShowLabel: false,
                        tabBarStyle: {
                                position: "absolute",
                                bottom: Math.max(insets.bottom, tabBar.horizontalInset),
                                height: tabBar.height,
                                marginHorizontal: tabBar.horizontalInset,
                                borderRadius: tabBar.radius,
                                backgroundColor: colors.primary,
                                borderTopWidth: 0,
                                elevation: 0
                        },
                        tabBarItemStyle: {
                                paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6,
                        },
                        tabBarIconStyle: {
                                width: tabBar.iconFrame,
                                height: tabBar.iconFrame,
                                alignSelf: "center"
                        }
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
                            }}
                        />
                    ))}
                    <Tabs.Screen name="settings" options={{ href: null }} />
            </Tabs>
        );
};

export default TabLayout;