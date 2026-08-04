import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Booking, toBooking } from "../shared/types";
import { colors } from "../../styles/globalStyles";
import { formatDateTime, toDate } from "../chat/chatHelpers";

export default function BookingsListScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("renterID", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snap) => {
        const data = snap.docs
          .flatMap((document) => {
            const booking = toBooking(document.id, document.data());
            return booking ? [booking] : [];
          })
          .sort((a, b) => {
            const aTime =
              toDate(a.scheduledAt)?.getTime() ||
              toDate(a.createdAt)?.getTime() ||
              0;

            const bTime =
              toDate(b.scheduledAt)?.getTime() ||
              toDate(b.createdAt)?.getTime() ||
              0;

            return aTime - bTime;
          });

        setBookings(data);
        setLoading(false);
      },
      (e) => {
        console.log("Bookings error:", e);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Upcoming viewings</Text>

      {bookings.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.empty}>No bookings yet</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("BookingDetailsScreen", {
                  id: item.id,
                })
              }
            >
              {item.listingImage ? (
                <Image
                  source={{ uri: item.listingImage }}
                  style={styles.image}
                />
              ) : null}

              <View style={styles.cardHeader}>
                <Text style={styles.name}>
                  {item.listingTitle || item.listingName || "Property"}
                </Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.meta}>
                {item.listingAddress || "Address unavailable"}
              </Text>

              <Text style={styles.meta}>
                Landlord: {item.landlordName || "Landlord"}
              </Text>

              <Text style={styles.sub}>
                Viewing date: {formatDateTime(item.scheduledAt)}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    paddingHorizontal: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 10,
    color: colors.black,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  image: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },

  statusBadge: {
    backgroundColor: "#E5EBFB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusText: {
    color: colors.primaryBlue,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  sub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  meta: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 6,
  },

  empty: {
    color: colors.textSecondary,
    textAlign: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
