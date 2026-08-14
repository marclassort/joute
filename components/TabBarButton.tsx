import React from "react";
import {Pressable, Text} from "react-native";
import type {BottomTabBarButtonProps} from "@react-navigation/bottom-tabs";
import {plateauColors} from "@/constants/theme";
import TabBarIcon, {TabIconName} from "@/components/TabBarIcon";

export interface TabBarButtonProps extends BottomTabBarButtonProps {
    icon: TabIconName;
    title: string;
}

/** Bouton d'onglet v2 (project-update/) : icône + label dans une seule pastille (pas de rond séparé
 * juste autour de l'icône) — remplace le tabBarIcon/tabBarLabel par défaut de react-navigation. */
const TabBarButton = ({icon, title, onPress, onLongPress, style, testID, ...rest}: TabBarButtonProps) => {
    const focused = !!rest["aria-selected"];

    return (
        <Pressable
            testID={testID}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={{selected: focused}}
            accessibilityLabel={title}
            style={[
                style,
                {
                    height: 62,
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    borderRadius: 21,
                    backgroundColor: focused ? plateauColors.coral : "transparent",
                },
            ]}
        >
            <TabBarIcon name={icon} color={focused ? plateauColors.ink : "rgba(246,240,230,0.62)"} />
            <Text
                className="tabs-label"
                style={{color: focused ? plateauColors.ink : "rgba(246,240,230,0.62)"}}
                numberOfLines={1}
            >
                {title}
            </Text>
        </Pressable>
    );
};

export default TabBarButton;
