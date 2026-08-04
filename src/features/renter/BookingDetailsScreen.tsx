import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Image,
    ScrollView,
    Pressable,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { colors } from "../../styles/globalStyles";
import { formatDateTime } from "../chat/chatHelpers";
import { Booking, toBooking } from "../shared/types";

export default function BookingDetailsScreen({ route }: any) {
    const bookingId = route?.params?.id || route?.params?.bookingId;

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const user = auth.currentUser;

    useEffect(() => {
        const load = async () => {
            if (!bookingId) {
                setLoading(false);
                return;
            }

            try {
                const snap = await getDoc(doc(db, "bookings", bookingId));

                if (snap.exists()) {
                    setBooking(toBooking(snap.id, snap.data()));
                } else {
                    setBooking(null);
                }
            } catch (e) {
                console.log("BookingDetails error:", e);
                setBooking(null);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [bookingId]);

    const canWithdraw =
        booking &&
        booking.status === "pending" &&
        user?.uid === booking.renterID;

    const withdrawBooking = async () => {
        if (!bookingId || !canWithdraw) return;

        Alert.alert(
            "Withdraw request",
            "This will cancel your viewing request.",
            [
                { text: "No" },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setUpdating(true);

                            await updateDoc(doc(db, "bookings", bookingId), {
                                status: "cancelled",
                                updatedAt: new Date(),
                            });

                            setBooking((prev) =>
                                prev ? { ...prev, status: "cancelled" } : prev
                            );
                        } catch (e) {
                            console.log("Withdraw error:", e);
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={colors.primaryBlue} />
            </SafeAreaView>
        );
    }

    if (!bookingId) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.error}>Missing booking reference</Text>
            </SafeAreaView>
        );
    }

    if (!booking) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.error}>Booking not found</Text>
            </SafeAreaView>
        );
    }

    const isLandlord = user?.uid === booking.landlordID;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>
                    {booking.listingTitle || booking.listingName || "Booking"}
                </Text>

                {booking.listingImage ? (
                    <Image source={{ uri: booking.listingImage }} style={styles.image} />
                ) : null}

                <View style={styles.card}>
                    <Text style={styles.label}>Status</Text>
                    <Text style={styles.value}>{booking.status}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Address</Text>
                    <Text style={styles.value}>
                        {booking.listingAddress || "N/A"}
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Scheduled time</Text>
                    <Text style={styles.value}>
                        {formatDateTime(booking.scheduledAt)}
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>
                        {isLandlord ? "Renter" : "Landlord"}
                    </Text>
                    <Text style={styles.value}>
                        {isLandlord ? booking.renterName : booking.landlordName}
                    </Text>
                </View>

                {canWithdraw ? (
                    <Pressable
                        style={[styles.button, updating && { opacity: 0.6 }]}
                        onPress={withdrawBooking}
                        disabled={updating}
                    >
                        <Text style={styles.buttonText}>
                            {updating ? "Withdrawing..." : "Withdraw Request"}
                        </Text>
                    </Pressable>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F6F7FB",
    },

    content: {
        padding: 16,
    },

    title: {
        fontSize: 22,
        fontWeight: "800",
        color: colors.black,
        marginBottom: 12,
    },

    image: {
        width: "100%",
        height: 180,
        borderRadius: 14,
        marginBottom: 12,
    },

    card: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
    },

    label: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
        textTransform: "uppercase",
    },

    value: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.black,
    },

    button: {
        marginTop: 10,
        backgroundColor: "#EF4444",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    error: {
        color: colors.textSecondary,
    },
});
