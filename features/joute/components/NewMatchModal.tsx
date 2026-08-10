import {Modal, Pressable, Text, View} from "react-native";
import React from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";

export interface NewMatchModalProps {
    visible: boolean;
    onClose: () => void;
    onRandomOpponent: () => void;
}

const NewMatchModal = ({visible, onClose, onRandomOpponent}: NewMatchModalProps) => {
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
                            <View className={clsx("joute-option", "joute-option-disabled")}>
                                <Text className="joute-option-title">Inviter un ami</Text>
                                <Text className="joute-option-subtitle">Bientôt disponible</Text>
                            </View>

                            <Pressable className="joute-option" onPress={onRandomOpponent}>
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
