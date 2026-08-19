import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import React, {useEffect, useState} from "react";
import * as ImagePicker from "expo-image-picker";
import {useUser} from "@clerk/expo";
import {plateauColors} from "@/constants/theme";
import PrimaryButton from "@/components/PrimaryButton";

const EditProfileModal = ({visible, onClose}: EditProfileModalProps) => {
    const {user} = useUser();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible || !user) return;
        setFirstName(user.firstName ?? "");
        setLastName(user.lastName ?? "");
        setAvatarUri(user.imageUrl ?? null);
        setPendingImageBase64(null);
        setError(null);
    }, [visible, user]);

    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setError("Autorisez l'accès à vos photos pour changer votre photo de profil.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        const asset = result.assets?.[0];
        if (result.canceled || !asset?.base64) return;

        setAvatarUri(asset.uri);
        setPendingImageBase64(asset.base64);
    };

    const handleSave = async () => {
        if (!user) return;

        setError(null);
        setIsSaving(true);
        try {
            await user.update({firstName: firstName.trim(), lastName: lastName.trim()});

            if (pendingImageBase64) {
                await user.setProfileImage({file: `data:image/jpeg;base64,${pendingImageBase64}`});
            }

            onClose();
        } catch {
            setError("Impossible d'enregistrer vos modifications. Réessayez.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="modal-overlay">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    className="mt-auto"
                >
                    <View className="modal-container">
                        <View className="modal-header">
                            <Text className="modal-title">Modifier le profil</Text>
                            <Pressable className="modal-close" onPress={onClose}>
                                <Text className="modal-close-text">×</Text>
                            </Pressable>
                        </View>

                        <ScrollView contentContainerClassName="modal-body" keyboardShouldPersistTaps="handled">
                            <Pressable className="items-center gap-2" onPress={handlePickImage} disabled={isSaving}>
                                {avatarUri ? (
                                    <Image source={{uri: avatarUri}} className="settings-avatar" />
                                ) : (
                                    <View className="settings-avatar bg-plateau-iris" />
                                )}
                                <Text className="session-link">Changer la photo</Text>
                            </Pressable>

                            <View className="session-field">
                                <Text className="session-label">Prénom</Text>
                                <TextInput
                                    className="session-input"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Prénom"
                                    placeholderTextColor={plateauColors.ink + "80"}
                                    autoCapitalize="words"
                                    editable={!isSaving}
                                />
                            </View>

                            <View className="session-field">
                                <Text className="session-label">Nom</Text>
                                <TextInput
                                    className="session-input"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Nom"
                                    placeholderTextColor={plateauColors.ink + "80"}
                                    autoCapitalize="words"
                                    editable={!isSaving}
                                />
                            </View>

                            {error && <Text className="session-error">{error}</Text>}

                            <PrimaryButton title={isSaving ? "Enregistrement…" : "Enregistrer"} onPress={handleSave} disabled={isSaving} borderRadius={16} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default EditProfileModal;
