import "@/global.css"
import {FlatList, Image, Pressable, Text, View} from "react-native";
import { styled } from "nativewind";
import {SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import {useUser} from "@clerk/expo";
import {useRouter} from "expo-router";
import {HOME_BALANCE, UPCOMING_SUBSCRIPTIONS} from "@/constants/data";
import {icons} from "@/constants/icons";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import {useState} from "react";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import {useSubscriptions} from "@/context/SubscriptionsContext";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
    const {subscriptions, addSubscription} = useSubscriptions();
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const { user } = useUser();
    const router = useRouter();

    const displayName = user?.firstName || user?.primaryEmailAddress?.emailAddress || "";
    const avatarUri = user?.imageUrl;

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <FlatList
                ListHeaderComponent={() => (
                    <>
                        <View className="home-header">
                            <View className="home-user">
                                {avatarUri ? (
                                    <Image source={{ uri: avatarUri }} className="home-avatar" />
                                ) : (
                                    <View className="home-avatar bg-muted" />
                                )}
                                <Text className="home-user-name" numberOfLines={1} ellipsizeMode="tail">
                                    {displayName}
                                </Text>
                                <Pressable onPress={() => setCreateModalVisible(true)}>
                                    <Image source={icons.add} className="home-add-icon" />
                                </Pressable>
                            </View>
                            <Pressable onPress={() => router.push("/settings")} className="ml-3">
                                <Image source={icons.menu} className="home-add-icon" />
                            </Pressable>
                        </View>
                        <View className="home-balance-card">
                            <Text className="home-balance-label">
                                Balance
                            </Text>
                            <View className="home-balance-row">
                                <Text className="home-balance-amount">
                                    {formatCurrency(HOME_BALANCE.amount)}
                                </Text>
                                <Text className="home-balance-date">
                                    {dayjs(HOME_BALANCE.nextRenewalDate).format('DD/MM') }
                                </Text>
                            </View>
                        </View>
                        <View className="mb-5">
                            <ListHeading title="À venir" />

                            <FlatList
                                ListHeaderComponent={<View className="h-4" /> }
                                data={UPCOMING_SUBSCRIPTIONS}
                                renderItem={({ item }) => (
                                    <UpcomingSubscriptionCard {...item} />
                                )}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                ListEmptyComponent={<Text className="home-empty-state">Pas de nouveaux abonnements</Text>}
                            />
                        </View>
                        <ListHeading title="Tous les abonnements" />
                    </>
                )}
                data={subscriptions}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                    <SubscriptionCard
                        { ...item}
                        expanded={expandedSubscriptionId === item.id }
                        onPress={() => setExpandedSubscriptionId((currentId) =>
                            (currentId === item.id ? null : item.id))}
                    />
                )}
                extraData={expandedSubscriptionId}
                ItemSeparatorComponent={() => <View className="h-4" />}
                ListEmptyComponent={<Text className="home-empty-state">Pas d&#39;abonnements encore.</Text>}
                contentContainerClassName="pb-30"
            />
            <CreateSubscriptionModal
                visible={isCreateModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onCreate={addSubscription}
            />
        </SafeAreaView>
    );
}