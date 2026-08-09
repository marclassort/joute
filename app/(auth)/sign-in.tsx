import {View, Text} from "react-native";
import {Link} from "expo-router";

const signIn = () => {
    return (
        <View>
            <Text>Se connecter</Text>
            <Link href="/(auth)/sign-in">
                Me connecter
            </Link>
        </View>
    )
}

export default signIn