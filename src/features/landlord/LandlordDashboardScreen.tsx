import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../config/firebase";
import { colors } from "../../styles/globalStyles";

export default function LandlordDashboardScreen({ navigation }: any) {
  const [listings, setListings] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  const displayName =
    userProfile?.firstName ||
    userProfile?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  useFocusEffect(
    useCallback(() => {
      const loadListings = async () => {
        const user = auth.currentUser;

        if (!user) {
          setListings([]);
          setLoading(false);
          setError("Landlord user not found.");
          return;
        }

        try {
          setLoading(true);
          setError(null);

          const userSnap = await getDoc(doc(db, "users", user.uid));
          const userData = userSnap.exists() ? userSnap.data() : null;
          setUserProfile(userData);

          const listingIDs = Array.isArray(userData?.listingIDs)
            ? userData.listingIDs.filter((id: any) => typeof id === "string" && id.trim())
            : [];

          if (listingIDs.length === 0) {
            setListings([]);
          } else {
            const chunks: string[][] = [];

            for (let i = 0; i < listingIDs.length; i += 10) {
              chunks.push(listingIDs.slice(i, i + 10));
            }

            const results: any[] = [];

            for (const chunk of chunks) {
              const listingsQuery = query(
                collection(db, "listings"),
                where(documentId(), "in", chunk)
              );

              const snap = await getDocs(listingsQuery);
              snap.forEach((d) => {
                results.push({ id: d.id, ...d.data() });
              });
            }

            const listingsByID = new Map(results.map((item) => [item.id, item]));
            setListings(
              listingIDs
                .map((id: string) => listingsByID.get(id))
                .filter(Boolean)
            );
          }

          const bookingsSnap = await getDocs(
            query(collection(db, "bookings"), where("landlordID", "==", user.uid))
          );

          setBookingsCount(bookingsSnap.size);
        } catch (e: any) {
          setError(e?.message || "Failed to load listings.");
        } finally {
          setLoading(false);
        }
      };

      loadListings();
    }, [])
  );

  const activeListingsCount = listings.filter(
    (listing) => listing.status === "Active"
  ).length;

  const metrics = [
    {
      label: "Listings",
      value: listings.length,
      icon: "home-outline",
      screen: null,
    },
    {
      label: "Active",
      value: activeListingsCount,
      icon: "checkmark-circle-outline",
      screen: null,
    },
    {
      label: "Bookings",
      value: bookingsCount,
      icon: "calendar-outline",
      screen: "Bookings",
    },
    {
      label: "Add",
      value: "+",
      icon: "add-circle-outline",
      screen: "AddListingScreen",
    },
  ];

  const renderListing = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("EditListingScreen", {
          listing: item,
        })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.city} · {item.propertyType}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.cardMeta}>
        {item.bedrooms} bed · {item.bathrooms} bath · {item.sizeSqft} sqft
      </Text>

      <Text style={styles.price}>
        ${item.price?.amount}/{item.price?.period}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {userProfile?.avatarUrl ? (
          <Image source={{ uri: userProfile.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        )}

        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hi, {displayName}</Text>
          <Text style={styles.subtitle}>Manage your rental listings</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("LandlordProfileScreen")}
          style={styles.settingsBtn}
        >
          <Ionicons name="options-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={styles.metrics}>
        {metrics.map((metric) => (
          <TouchableOpacity
            key={metric.label}
            style={styles.metricCard}
            onPress={() => {
              if (metric.screen) {
                navigation.navigate(metric.screen);
              }
            }}
            disabled={!metric.screen}
          >
            <Ionicons name={metric.icon as any} size={22} color={colors.primaryBlue} />
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Loading listings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No listings yet.</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListing}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddListingScreen")}
      >
        <Text style={styles.addButtonText}>Add Listing</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.deepPurple,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  headerText: {
    flex: 1,
    marginLeft: 10,
  },

  settingsBtn: {
    padding: 6,
  },

  greeting: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
    gap: 10,
  },

  metricCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 6,
  },

  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 150,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  cardTitleBlock: {
    flex: 1,
    paddingRight: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  cardMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
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
  },

  price: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  emptyText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },

  error: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  addButton: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 112,
    backgroundColor: colors.deepPurple,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
