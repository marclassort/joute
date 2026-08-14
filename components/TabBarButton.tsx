import React from "react";
import {Pressable, Text, View} from "react-native";
import type {BottomTabBarButtonProps} from "@react-navigation/bottom-tabs";
import {plateauColors} from "@/constants/theme";
import TabBarIcon, {TabIconName} from "@/components/TabBarIcon";

export interface TabBarButtonProps extends BottomTabBarButtonProps {
    icon: TabIconName;
    title: string;
    /** Compteur affiché en pastille sur l'icône (ex. parties où c'est ton tour) — omis si 0/undefined. */
    badge?: number;
}

/** Bouton d'onglet v2 (project-update/) : icône + label dans une seule pastille (pas de rond séparé
 * juste autour de l'icône) — remplace le tabBarIcon/tabBarLabel par défaut de react-navigation. */
const TabBarButton = ({icon, title, badge, onPress, onLongPress, testID, ...rest}: TabBarButtonProps) => {
    const focused = !!rest["aria-selected"];

    return (
        <Pressable
            testID={testID}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={{selected: focused}}
            accessibilityLabel={title}
            style={{
                flex: 1,
                marginVertical: 7,
                padding: 0,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                borderRadius: 21,
                backgroundColor: focused ? plateauColors.coral : "transparent",
            }}
        >
            <TabBarIcon name={icon} color={focused ? plateauColors.ink : "rgba(246,240,230,0.62)"} />
            <Text
                className="tabs-label"
                style={{color: focused ? plateauColors.ink : "rgba(246,240,230,0.62)"}}
                numberOfLines={1}
            >
                {title}
            </Text>
            {!!badge && (
                <View
                    style={{
                        position: "absolute",
                        top: 4,
                        right: 15,
                        minWidth: 17,
                        height: 17,
                        borderRadius: 9,
                        paddingHorizontal: 4,
                        backgroundColor: plateauColors.coral,
                        borderWidth: 2,
                        borderColor: plateauColors.ink,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Text style={{fontSize: 10, fontWeight: "700", color: plateauColors.ink}}>{badge}</Text>
                </View>
            )}
        </Pressable>
    );
};

export default TabBarButton;
