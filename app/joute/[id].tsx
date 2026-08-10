import {View, Text} from "react-native";
import React from "react";
import {Link, useLocalSearchParams} from "expo-router";

const JouteMatch = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    return (
        <View>
            <Text>Partie Joute : {id}</Text>
            <Link href="/joute">Retour</Link>
        </View>
    )
}

export default JouteMatch
