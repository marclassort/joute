import {FlatList, Text, View} from "react-native";
import React, {useState} from "react";
import { styled } from "nativewind";
import {SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import {useSubscriptions} from "@/context/SubscriptionsContext";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
    const {subscriptions} = useSubscriptions();
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper p-5">
            <FlatList
                ListHeaderComponent={<ListHeading title="Abonnements suivis" />}
                data={subscriptions}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedSubscriptionId === item.id}
                        onPress={() => setExpandedSubscriptionId((currentId) =>
                            (currentId === item.id ? null : item.id))}
                    />
                )}
                extraData={expandedSubscriptionId}
                ItemSeparatorComponent={() => <View className="h-[10px]" />}
                ListEmptyComponent={<Text className="home-empty-state">Pas d&#39;abonnements encore.</Text>}
                contentContainerClassName="pb-30"
            />
        </SafeAreaView>
    )
}

export default Subscriptions
