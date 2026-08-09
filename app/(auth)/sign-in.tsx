import {View, Text} from "react-native";
import {Link} from "expo-router";

const signIn = () => {
    return (
        <View>
            <Text>Inscription</Text>
            <Link href="/(auth)/inscription">
                Créer un compte
            </Link>
        </View>
    )
}

export default signIn