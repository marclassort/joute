import { useAuth } from "@clerk/expo";
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { ActivityIndicator, Button, StyleSheet, View } from "react-native";

const SignIn = () => {
    const { isLoaded } = useAuth();
    const { startHostedAuth } = useHostedAuth();

    const handleSignIn = async () => {
        try {
            await startHostedAuth({ mode: "sign-in" });
        } catch (error) {
            console.error(error);
        }
    };

    if (!isLoaded) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Button title="Se connecter" onPress={handleSignIn} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 12,
        alignItems: "center",
        justifyContent: "center",
    },
});

export default SignIn;
