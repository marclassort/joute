import {View, Text} from "react-native";
import {Link} from "expo-router";

const signUp = () => {
    return (
        <View>
            <Text>S&#39;inscrire</Text>
            <Link href="/(auth)/sign-up">
                Créer un compte
            </Link>
        </View>
    )
}

export default signUp