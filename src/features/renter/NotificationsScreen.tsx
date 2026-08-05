import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import { auth, db } from "../../config/firebase";
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { colors } from "../../styles/globalStyles";
import { formatDateTime, toDate } from "../chat/chatHelpers";

export default function NotificationsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snap) => {
        const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
          const aTime = toDate(a.createdAt)?.getTime() || 0;
          const bTime = toDate(b.createdAt)?.getTime() || 0;

          return bTime - aTime;
        });

        setNotifications(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, [user]);

  const dismiss = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), {
      dismissedAt: serverTimestamp(),
    });
  };

  const visible = notifications.filter((notification) => !notification.dismissedAt);

  const getMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Viewing request submitted";
      case "accepted":
        return "Viewing accepted";
      case "rejected":
        return "Viewing rejected";
      case "completed":
        return "Viewing completed";
      default:
        return "Booking update";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      {visible.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <Swipeable
              renderRightActions={() => (
                <Pressable
                  onPress={() => dismiss(item.id)}
                  style={styles.deleteAction}
                >
                  <Text style={styles.deleteText}>Dismiss</Text>
                </Pressable>
              )}
            >
              <Pressable
                onPress={() =>
                  navigation.navigate("BookingDetailsScreen", {
                    bookingId: item.id,
                  })
                }
                style={styles.card}
              >
                <View style={styles.row}>
                  <Text style={styles.name}>
                    {item.listingTitle || item.listingName || "Property"}
                  </Text>

                  <Text style={styles.status}>
                    {item.status}
                  </Text>
                </View>

                <Text style={styles.message}>
                  {item.body || getMessage(item.status)}
                </Text>

                <Text style={styles.meta}>
                  Booking update
                </Text>

                <Text style={styles.time}>
                  {formatDateTime(item.createdAt)}
                </Text>
              </Pressable>
            </Swipeable>
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
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.black,
  },

  status: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryBlue,
    textTransform: "capitalize",
  },

  message: {
    marginTop: 6,
    fontSize: 13,
    color: "#4B5563",
  },

  meta: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },

  time: {
    marginTop: 6,
    fontSize: 11,
    color: "#9CA3AF",
  },

  emptyCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
  },

  emptyText: {
    textAlign: "center",
    color: "#6B7280",
  },

  deleteAction: {
    backgroundColor: "red",
    justifyContent: "center",
    padding: 20,
    borderRadius: 14,
    marginBottom: 10,
  },

  deleteText: {
    color: "white",
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
