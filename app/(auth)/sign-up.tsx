import {View, Text} from "react-native";
import {Link} from "expo-router";

const signUp = () => {
    return (
        <View>
            <Text>Connexion</Text>
            <Link href="/(auth)/connexion">
                Connexion
            </Link>
        </View>
    )
}

export default signUp