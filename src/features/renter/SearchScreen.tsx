import React, { useEffect, useState, useMemo } from "react";
import { View, TextInput, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
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

const TAB_OVERLAP = 90;

export default function SearchScreen({ navigation }: any) {
  const [listings, setListings] = useState<any[]>([]);
  const [prefs, setPrefs] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<any>(null);

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
      const snap = await getDocs(collection(db, "listings"));
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

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

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard item={item} navigation={navigation} />
        )}
        contentContainerStyle={{ paddingBottom: TAB_OVERLAP }}
        showsVerticalScrollIndicator={false}
      />
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
});
