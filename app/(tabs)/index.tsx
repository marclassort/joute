import "@/global.css"
import {FlatList, Image, Text, View} from "react-native";
import { styled } from "nativewind";
import images from "@/constants/images"
import {SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import {HOME_BALANCE, HOME_SUBSCRIPTIONS, HOME_USER, UPCOMING_SUBSCRIPTIONS} from "@/constants/data";
import {icons} from "@/constants/icons";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import {useState} from "react";
import SubscriptionCard from "@/components/SubscriptionCard";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <FlatList
                ListHeaderComponent={() => (
                    <>
                        <View className="home-header">
                            <View className="home-user">
                                <Image source={images.avatar} className="home-avatar" />
                                <Text className="home-user-name">{HOME_USER.name}</Text>
                                <Image source={icons.add} className="home-add-icon" />
                            </View>
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
                                ListEmptyComponent={<Text className="home-empty-state">Pas de nouvelles inscriptions</Text>}
                            />
                        </View>
                        <ListHeading title="Toutes les inscriptions" />
                    </>
                )}
                data={HOME_SUBSCRIPTIONS}
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
                ListEmptyComponent={<Text className="home-empty-state">Pas d&#39;inscriptions encore.</Text>}
                contentContainerClassName="pb-30"
            />
        </SafeAreaView>
    );
}