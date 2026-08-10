import {View, Text, Image} from "react-native";
import React from "react";
import {formatCurrency} from "@/lib/utils";

const UpcomingSubscriptionCard = ({ name, price, daysLeft, icon, currency }: UpcomingSubscription) => {
    return (
        <View className="upcoming-card">
            <View className="upcoming-row">
                <Image source={icon} className="upcoming-icon"/>
                <View className="upcoming-copy">
                    <Text className="upcoming-price" numberOfLines={1}>{formatCurrency(price, currency)}</Text>
                    <Text className="upcoming-meta" numberOfLines={1}>
                        {daysLeft > 1 ? `${daysLeft} jours restants` : 'Dernier jour'}
                    </Text>
                </View>
            </View>

            <Text className="upcoming-name" numberOfLines={1}>{name}</Text>
        </View>
    )
}

export default UpcomingSubscriptionCard