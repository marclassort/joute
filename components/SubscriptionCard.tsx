import {View, Text, Image, Pressable} from "react-native";
import React from "react";
import {formatCurrency, formatStatusLabel, formatSubscriptionDateTime} from "@/lib/utils";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";

const SubscriptionCard = ( {name, price, currency, icon, billing, color, category, plan, renewalDate, expanded, onPress, paymentMethod, startDate, status }:
                           SubscriptionCardProps) => {
    const fallback = "Non renseigné";
    return (
        <Pressable onPress={onPress} className={clsx('sub-card', expanded ? 'sub-card-expanded' : 'bg-card')} style={!expanded && color ? { backgroundColor: color } : undefined }>
            <View className="sub-head">
                <View className="sub-main">
                    <Image source={icon} className="sub-icon" />
                    <View className="sub-copy">
                        <Text numberOfLines={1} className="sub-title">
                            {name}
                        </Text>
                        <Text className="sub-meta" numberOfLines={1} ellipsizeMode="tail">
                            {category?.trim() || plan?.trim() || (renewalDate ? formatSubscriptionDateTime(renewalDate): '')}
                        </Text>
                    </View>
                </View>

                <View className="sub-price-box">
                    <Text className="sub-price">{formatCurrency(price, currency)}</Text>
                    <Text className="sub-billing">{billing}</Text>
                </View>
            </View>

            {expanded && (
                <View className="sub-body">
                    <View className="sub-details">
                        <View className="sub-row">
                            <Text className="sub-label">Paiement</Text>
                            <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                {paymentMethod?.trim() || fallback}
                            </Text>
                        </View>
                        <View className="sub-row">
                            <Text className="sub-label">Catégorie</Text>
                            <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                {category?.trim() || plan?.trim() || fallback}
                            </Text>
                        </View>
                        <View className="sub-row">
                            <Text className="sub-label">Depuis</Text>
                            <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                {startDate ? formatSubscriptionDateTime(startDate) : fallback}
                            </Text>
                        </View>
                        <View className="sub-row">
                            <Text className="sub-label">Renouvellement</Text>
                            <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                {renewalDate ? formatSubscriptionDateTime(renewalDate) : fallback}
                            </Text>
                        </View>
                        <View className="sub-row">
                            <Text className="sub-label">Statut</Text>
                            <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                {status ? formatStatusLabel(status) : fallback}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </Pressable>
    )
}

export default SubscriptionCard