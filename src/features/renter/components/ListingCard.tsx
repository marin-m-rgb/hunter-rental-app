import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../../styles/globalStyles";
import { Listing } from "../../shared/types";

type ListingCardProps = {
  item: Listing;
  navigation: any;
};

export default function ListingCard({ item, navigation }: ListingCardProps) {

  const normalizedPrice =
    typeof item?.price === "object" && item?.price !== null
      ? item.price
      : {
        amount: item?.price ?? 0,
        period: "per month",
      };

  const amount = normalizedPrice.amount;
  const period = normalizedPrice.period;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("PropertyDetailsScreen", {
          listing: item,
        })
      }
    >
      <Image
        source={{ uri: item.images?.[0] }}
        style={styles.image}
      />

      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.title} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.sub}>
            {item.city} · {item.propertyType}
          </Text>

          <Text style={styles.meta}>
            {item.bedrooms} bed · {item.bathrooms} bath
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.price}>${amount}</Text>
          <Text style={styles.period}>/{period}</Text>
        </View>
      </View>

      <Text style={styles.address} numberOfLines={1}>
        {item.address}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
  },

  image: { width: "100%", height: 140 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },

  left: { flex: 1, paddingRight: 10 },

  right: { alignItems: "flex-end", justifyContent: "center" },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.black,
  },

  sub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  meta: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  price: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.black,
  },

  period: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  address: {
    fontSize: 11,
    color: "#9CA3AF",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});
