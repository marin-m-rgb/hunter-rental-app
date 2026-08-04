import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, doc, getDoc, getDocs, query as firestoreQuery, where } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import ListingCard from "./components/ListingCard";
import FilterBar from "./components/FilterBar";
import { Filters } from "./utils/types";
import { getUserLocation } from "./utils/location";
import { CAMPUSES } from "./data/campuses";
import { getDistanceKm } from "./utils/distance";
import {
  normalizeListingRecord,
  normalizeRenterPreferences,
} from "../shared/listingSchema";
import { Listing, toListing } from "../shared/types";

const TAB_OVERLAP = 90;

export default function SearchScreen({ navigation }: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [prefs, setPrefs] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [filters, setFilters] = useState<Filters>({
    bedrooms: null,
    furnished: null,
    propertyType: null,
    leaseLength: null,
    sortBy: "relevance",
  });

  // LOAD LISTINGS
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const snap = await getDocs(
          firestoreQuery(
            collection(db, "listings"),
            where("status", "==", "Active")
          )
        );

        setListings(
          snap.docs.flatMap((document) => {
            const listing = toListing(document.id, document.data());
            return listing ? [listing] : [];
          })
        );
      } catch {
        setListings([]);
        setLoadError("Could not load listings. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reloadToken]);

  // LOAD PREFS 
  useEffect(() => {
    const loadPrefs = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      const prefs = snap.exists() ? snap.data()?.renterPreferences || null : null;
      setPrefs(normalizeRenterPreferences(prefs));
    };
    loadPrefs();
  }, []);

  // LOCATION
  useEffect(() => {
    const loadLocation = async () => {
      const loc = await getUserLocation();
      setUserLocation(loc);
    };
    loadLocation();
  }, []);

  const results = useMemo(() => {
    let data = listings.map((listing) => normalizeListingRecord(listing));
    const q = query.trim().toLowerCase();

    const campus = CAMPUSES.find(c => c.id === prefs?.campusId);

    // TEXT SEARCH 
    if (q) {
      data = data.filter((l) =>
        l.city?.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q) ||
        l.name?.toLowerCase().includes(q)
      );
    }

    // USER FILTERS 
    if (filters.bedrooms !== null) {
      data = data.filter((l) => l.bedrooms === filters.bedrooms);
    }

    if (filters.furnished !== null) {
      data = data.filter((l) => l.furnished === filters.furnished);
    }

    if (filters.propertyType) {
      data = data.filter((l) => l.propertyType === filters.propertyType);
    }

    if (filters.leaseLength) {
      data = data.filter((l) => l.leaseLength === filters.leaseLength);
    }

    // DISTANCE 
    data = data.map((l) => {
      let distance = null;

      if (campus && l.lat && l.lng) {
        distance = getDistanceKm(campus.lat, campus.lng, l.lat, l.lng);
      } else if (userLocation && l.lat && l.lng) {
        distance = getDistanceKm(
          userLocation.lat,
          userLocation.lng,
          l.lat,
          l.lng
        );
      }

      return { ...l, distance };
    });

    // SORTING
    if (filters.sortBy === "price") {
      data.sort((a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0));
    }

    if (filters.sortBy === "distance") {
      data.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    }

    if (filters.sortBy === "relevance") {
      data.sort((a, b) => {
        let aScore = 0;
        let bScore = 0;

        if (prefs?.budget) {
          if ((a.price?.amount ?? 0) <= prefs.budget) aScore++;
          if ((b.price?.amount ?? 0) <= prefs.budget) bScore++;
        }

        if (prefs?.propertyTypes?.length) {
          if (prefs.propertyTypes.includes(a.propertyType)) aScore++;
          if (prefs.propertyTypes.includes(b.propertyType)) bScore++;
        }

        if (prefs?.housingTypes?.length) {
          if (prefs.housingTypes.includes(a.housingType)) aScore++;
          if (prefs.housingTypes.includes(b.housingType)) bScore++;
        }

        if ((a.distance ?? 999) < 5) aScore++;
        if ((b.distance ?? 999) < 5) bScore++;

        return bScore - aScore;
      });
    }

    return data;
  }, [listings, prefs, query, filters, userLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search city, address..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      <FilterBar filters={filters} setFilters={setFilters} />

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0D74E7" />
          <Text style={styles.stateText}>Loading listings...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>{loadError}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => setReloadToken((current) => current + 1)}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard item={item} navigation={navigation} />
          )}
          contentContainerStyle={[
            styles.listContent,
            results.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matching listings</Text>
              <Text style={styles.stateText}>
                Try changing your search or filters.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB"
  },

  searchBox: {
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
  },

  searchInput: {
    fontSize: 14
  },

  listContent: {
    paddingBottom: TAB_OVERLAP,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  emptyState: {
    alignItems: "center",
    padding: 24,
  },

  emptyTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },

  stateText: {
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
  },

  retryButton: {
    backgroundColor: "#0D74E7",
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
