import {Modal, Pressable, Text, View} from "react-native";
import React from "react";

export interface NewMatchModalProps {
    visible: boolean;
    onClose: () => void;
    onInviteFriend: () => void;
    onRandomOpponent: () => void;
}

const NewMatchModal = ({visible, onClose, onInviteFriend, onRandomOpponent}: NewMatchModalProps) => {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="modal-overlay">
                <View className="mt-auto">
                    <View className="modal-container">
                        <View className="modal-header">
                            <Text className="modal-title">Nouvelle partie</Text>
                            <Pressable className="modal-close" onPress={onClose}>
                                <Text className="modal-close-text">×</Text>
                            </Pressable>
                        </View>

                        <View className="modal-body">
                            <Pressable className="joute-option" onPress={onInviteFriend} accessibilityRole="button">
                                <Text className="joute-option-title">Inviter un ami</Text>
                                <Text className="joute-option-subtitle">Génère un lien à partager</Text>
                            </Pressable>

                            <Pressable className="joute-option" onPress={onRandomOpponent} accessibilityRole="button">
                                <Text className="joute-option-title">Adversaire aléatoire</Text>
                                <Text className="joute-option-subtitle">Démarre une partie tout de suite contre un profil de démonstration</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default NewMatchModal;
