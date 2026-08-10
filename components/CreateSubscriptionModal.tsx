import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import React, {useState} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import dayjs from "dayjs";
import {colors} from "@/constants/theme";
import {icons} from "@/constants/icons";

const FREQUENCY_OPTIONS = ["Monthly", "Yearly"] as const;

const CATEGORY_COLORS: Record<string, string> = {
    Entertainment: "#f5a3c7",
    "AI Tools": "#b8d4e3",
    "Developer Tools": "#e8def8",
    Design: "#f5c542",
    Productivity: "#b8e8d0",
    Cloud: "#c7e8f5",
    Music: "#f5b8a3",
    Other: "#e0e0e0",
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_COLORS);

const CreateSubscriptionModal = ({visible, onClose, onCreate}: CreateSubscriptionModalProps) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [frequency, setFrequency] = useState<(typeof FREQUENCY_OPTIONS)[number]>("Monthly");
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);

    const parsedPrice = Number(price);
    const isValid = name.trim().length > 0 && !Number.isNaN(parsedPrice) && parsedPrice > 0;

    const resetForm = () => {
        setName("");
        setPrice("");
        setFrequency("Monthly");
        setCategory(CATEGORY_OPTIONS[0]);
    };

    const handleSubmit = () => {
        if (!isValid) return;

        const startDate = dayjs();
        const renewalDate = startDate.add(1, frequency === "Monthly" ? "month" : "year");
        const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        onCreate({
            id: `${slug}-${Date.now()}`,
            name: name.trim(),
            price: parsedPrice,
            frequency,
            category,
            status: "active",
            startDate: startDate.toISOString(),
            renewalDate: renewalDate.toISOString(),
            icon: icons.wallet,
            billing: frequency,
            color: CATEGORY_COLORS[category],
        });

        resetForm();
        onClose();
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
                            <Text className="modal-title">New Subscription</Text>
                            <Pressable className="modal-close" onPress={onClose}>
                                <Text className="modal-close-text">×</Text>
                            </Pressable>
                        </View>

                        <ScrollView contentContainerClassName="modal-body" keyboardShouldPersistTaps="handled">
                            <View className="auth-field">
                                <Text className="auth-label">Name</Text>
                                <TextInput
                                    className="auth-input"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Netflix"
                                    placeholderTextColor={colors.mutedForeground}
                                />
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Price</Text>
                                <TextInput
                                    className="auth-input"
                                    value={price}
                                    onChangeText={setPrice}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.mutedForeground}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Frequency</Text>
                                <View className="picker-row">
                                    {FREQUENCY_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option}
                                            className={clsx("picker-option", frequency === option && "picker-option-active")}
                                            onPress={() => setFrequency(option)}
                                        >
                                            <Text
                                                className={clsx("picker-option-text", frequency === option && "picker-option-text-active")}
                                            >
                                                {option}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Category</Text>
                                <View className="category-scroll">
                                    {CATEGORY_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option}
                                            className={clsx("category-chip", category === option && "category-chip-active")}
                                            onPress={() => setCategory(option)}
                                        >
                                            <Text
                                                className={clsx("category-chip-text", category === option && "category-chip-text-active")}
                                            >
                                                {option}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <Pressable
                                className={clsx("auth-button", !isValid && "auth-button-disabled")}
                                onPress={handleSubmit}
                                disabled={!isValid}
                            >
                                <Text className="auth-button-text">Add Subscription</Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default CreateSubscriptionModal;
