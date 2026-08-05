import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { buttons, colors } from "../../styles/globalStyles";
import { formatDateTime } from "../chat/chatHelpers";
import { Conversation, toConversation } from "../shared/types";
import { addBookingNotification, createBookingBatch } from "../shared/bookingNotifications";

export default function CreateBookingScreen({ navigation, route }: any) {
  const conversationId = route?.params?.conversationId;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  const [scheduledAt, setScheduledAt] = useState(() => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(18, 0, 0, 0);
    return nextDate;
  });

  const user = auth.currentUser;

  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        setLoading(false);
        return;
      }

      const snap = await getDoc(doc(db, "conversations", conversationId));
      setConversation(snap.exists() ? toConversation(snap.id, snap.data()) : null);
      setLoading(false);
    };

    loadConversation();
  }, [conversationId]);

  const isLandlord = useMemo(
    () => !!user && !!conversation && conversation.landlordID === user.uid,
    [conversation, user]
  );

  const handlePickerChange = (_event: any, selectedValue?: Date) => {
    if (Platform.OS === "android") {
      setPickerMode(null);
    }

    if (!selectedValue) return;

    setScheduledAt((current) => {
      const nextDate = new Date(current);

      if (pickerMode === "date") {
        nextDate.setFullYear(
          selectedValue.getFullYear(),
          selectedValue.getMonth(),
          selectedValue.getDate()
        );
      }

      if (pickerMode === "time") {
        nextDate.setHours(selectedValue.getHours(), selectedValue.getMinutes(), 0, 0);
      }

      return nextDate;
    });
  };

  const handleCreateBooking = async () => {
    if (!user || !conversation || !isLandlord || saving) return;

    if (scheduledAt.getTime() <= Date.now()) {
      Alert.alert("Invalid date", "Please choose a future date and time.");
      return;
    }

    try {
      setSaving(true);

      const bookingRef = doc(collection(db, "bookings"));
      const batch = createBookingBatch();
      batch.set(bookingRef, {
        landlordID: conversation.landlordID,
        renterID: conversation.renterID,
        conversationID: conversation.id,
        listingID: conversation.listingID,
        listingD: conversation.listingID,
        listingTitle: conversation.listingName || "Property",
        listingName: conversation.listingName || "Property",
        listingAddress: conversation.listingAddress || "",
        listingImage: conversation.listingImage || "",
        renterName: conversation.renterName || "",
        landlordName: conversation.landlordName || "",
        scheduledAt,
        status: "pending",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      addBookingNotification(batch, {
        recipientId: conversation.renterID,
        bookingId: bookingRef.id,
        listingId: conversation.listingID,
        title: conversation.listingName || "Property",
        status: "pending",
      });
      await batch.commit();

      navigation.navigate("LandlordTabs", {
        screen: "Bookings",
      });
    } catch (e: any) {
      Alert.alert("Booking failed", e?.message || "Could not create booking.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </SafeAreaView>
    );
  }

  if (!conversation || !isLandlord) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.unavailableText}>Booking creation is unavailable.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>

      <Text style={styles.title}>Create Booking</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{conversation.listingName || "Property"}</Text>
        <Text style={styles.cardSub}>
          {conversation.listingAddress || "Address unavailable"}
        </Text>
        <Text style={styles.cardSub}>
          Renter: {conversation.renterName || "Renter"}
        </Text>
      </View>

      <View style={styles.selectorCard}>
        <Text style={styles.selectorTitle}>Viewing date</Text>
        <Pressable style={styles.selectorButton} onPress={() => setPickerMode("date")}>
          <Text style={styles.selectorLabel}>Date</Text>
          <Text style={styles.selectorValue}>
            {scheduledAt.toLocaleDateString([], {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </Pressable>

        <Pressable style={styles.selectorButton} onPress={() => setPickerMode("time")}>
          <Text style={styles.selectorLabel}>Time</Text>
          <Text style={styles.selectorValue}>
            {scheduledAt.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
        </Pressable>

        {pickerMode ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={scheduledAt}
              mode={pickerMode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handlePickerChange}
            />

            {Platform.OS === "ios" ? (
              <Pressable
                style={styles.doneButton}
                onPress={() => setPickerMode(null)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Selected slot</Text>
        <Text style={styles.summaryValue}>{formatDateTime(scheduledAt)}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[buttons.primary, styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleCreateBooking}
          disabled={saving}
        >
          <Text style={buttons.primaryText}>
            {saving ? "Creating..." : "Create Booking"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    paddingHorizontal: 16,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7FB",
    paddingHorizontal: 24,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
  },

  backButtonText: {
    fontSize: 32,
    lineHeight: 34,
    color: "#111827",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.black,
  },

  cardSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
  },

  selectorCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  selectorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 12,
  },

  selectorButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  selectorLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
    textTransform: "uppercase",
  },

  selectorValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  pickerWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },

  doneButton: {
    alignSelf: "flex-end",
    marginTop: 8,
  },

  doneButtonText: {
    color: colors.primaryBlue,
    fontWeight: "700",
  },

  summaryCard: {
    backgroundColor: "#E5EBFB",
    borderRadius: 16,
    padding: 16,
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryBlue,
    marginBottom: 6,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.black,
  },

  footer: {
    marginTop: "auto",
    paddingTop: 16,
    paddingBottom: 20,
  },

  submitButton: {
    width: "100%",
  },

  submitButtonDisabled: {
    opacity: 0.75,
  },

  unavailableText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});
