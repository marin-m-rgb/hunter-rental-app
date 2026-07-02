import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../styles/globalStyles";
import { CAMPUSES } from "./data/campuses";
import { getDistanceKm } from "./utils/distance";
import {
  normalizeListingRecord,
  normalizeRenterPreferences,
} from "../shared/listingSchema";

const TAB_OVERLAP = 90;

export default function RenterDashboardScreen({ navigation }: any) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [savedCount, setSavedCount] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const user = auth.currentUser;

  const displayName =
    userProfile?.name ||
    userProfile?.email?.split("@")[0] ||
    "User";

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : null;

      setUserProfile(userData);

      const prefs = normalizeRenterPreferences(userData?.renterPreferences);

      setSavedCount((userData?.favoritesID ?? []).length);

      const bookingSnap = await getDocs(
        query(collection(db, "bookings"), where("renterID", "==", user.uid))
      );

      setBookings(
        bookingSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );

      const listingsSnap = await getDocs(collection(db, "listings"));

      let listings = listingsSnap.docs.map((d) =>
        normalizeListingRecord({
          id: d.id,
          ...d.data(),
        })
      );

      const campus = CAMPUSES.find(c => c.id === prefs?.campusId);

      // 1. budget filter
      if (prefs?.budget) {
        listings = listings.filter((l: any) => {
          const price = l?.price?.amount;
          return typeof price === "number" && price <= prefs.budget;
        });
      }

      // 2. property type filter
      if (prefs?.propertyTypes?.length) {
        listings = listings.filter(
          (l: any) => prefs.propertyTypes.includes(l?.propertyType)
        );
      }

      // 3. housing type filter
      if (prefs?.housingTypes?.length) {
        listings = listings.filter(
          (l: any) => prefs.housingTypes.includes(l?.housingType)
        );
      }

      // 4. lease filter 
      if (prefs?.leaseLengths?.length) {
        listings = listings.filter((l: any) => prefs.leaseLengths.includes(l?.leaseLength));
      }

      // 5. distance filter 
      if (campus && prefs?.maxDistanceKm) {
        listings = listings.filter((l: any) => {
          if (!l?.lat || !l?.lng) return false;

          const dist = getDistanceKm(
            campus.lat,
            campus.lng,
            l.lat,
            l.lng
          );

          return dist <= prefs.maxDistanceKm;
        });
      }

      // 6. ranking
      const scored = listings.map((l: any) => {
        let score = 0;

        if (prefs?.lifestylePreferences?.length && l?.lifestylePreferences) {
          const overlap = l.lifestylePreferences.filter((tag: string) =>
            prefs.lifestylePreferences.includes(tag)
          ).length;

          score += overlap * 2;
        }

        if (prefs?.budget && l?.price?.amount) {
          const diff = prefs.budget - l.price.amount;
          if (diff >= 0) score += 1;
        }

        return { ...l, score };
      });

      scored.sort((a, b) => b.score - a.score);

      setRecommendations(scored.slice(0, 6));
    } catch (e) {
      console.log("Dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  const metrics = [
    {
      label: "Matches",
      value: recommendations.length,
      icon: "search-outline",
      screen: "Search",
    },
    {
      label: "Bookings",
      value: bookings.length,
      icon: "calendar-outline",
      screen: "BookingsListScreen",
    },
    {
      label: "Saved",
      value: savedCount,
      icon: "heart-outline",
      screen: "SavedListingsScreen",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: TAB_OVERLAP }]}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={styles.avatar}>
              {userProfile?.avatarUrl ? (
                <Image
                  source={{ uri: userProfile.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={18} color="#fff" />
              )}
            </View>

            <View style={{ marginLeft: 10 }}>
              <Text style={styles.greeting}>Hi, {displayName}</Text>
              <Text style={styles.sub}>Find your next home smarter</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("RenterProfileScreen")}
            style={styles.settingsButton}
          >
            <Ionicons name="options-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* METRICS */}
        <View style={styles.metrics}>
          {metrics.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={styles.metricCard}
              onPress={() => navigation.navigate(m.screen)}
            >
              <Ionicons name={m.icon as any} size={22} color={colors.primaryBlue} />
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECOMMENDED */}
        <Text style={styles.sectionTitle}>Recommended</Text>

        {recommendations.length === 0 ? (
          <Text style={{ paddingHorizontal: 20, color: "#6B7280" }}>
            No matches found. Adjust preferences or increase budget.
          </Text>
        ) : (
          recommendations.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.propertyCard}
              onPress={() =>
                navigation.navigate("PropertyDetailsScreen", { listing: item })
              }
            >
              <Image source={{ uri: item.images?.[0] }} style={styles.image} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>
                  ${item.price?.amount} · {item.city}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB"
  },

  content: {
    paddingBottom: 20
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  settingsButton: {
    padding: 8
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
    width: "100%",
    height: "100%",
    borderRadius: 19,
  },

  greeting: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827"
  },

  sub: {
    fontSize: 12,
    color: "#6B7280"
  },

  metrics: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 10,
  },

  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginHorizontal: 5,
  },

  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6
  },

  metricLabel: {
    fontSize: 12,
    color: "#6B7280"
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 20,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  propertyCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: 120
  },

  cardContent: {
    padding: 12
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "700"
  },

  cardSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4
  },
});
