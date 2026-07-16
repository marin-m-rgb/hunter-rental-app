import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { getUserLocation } from "./utils/location";

export default function MapScreen({ navigation }: any) {
  const [listings, setListings] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);

  // LOCATION
  useEffect(() => {
    const loadLocation = async () => {
      const loc = await getUserLocation();
      if (loc) setUserLocation(loc);
    };
    loadLocation();
  }, []);

  // LISTINGS
  useEffect(() => {
    const loadListings = async () => {
      const snap = await getDocs(collection(db, "listings"));
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    loadListings();
  }, []);

  // VALID COORDS 
  const validListings = useMemo(() => {
    return listings.filter(
      (l) =>
        typeof l.lat === "number" &&
        typeof l.lng === "number" &&
        !isNaN(l.lat) &&
        !isNaN(l.lng)
    );
  }, [listings]);

  const visibleListings = useMemo(() => {
    return validListings;
  }, [validListings]);

  // INITIAL REGION (campus -> user -> fallback)
  const initialRegion: Region = useMemo(() => {
    if (userLocation) {
      return {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };
    }

    if (visibleListings.length > 0) {
      return {
        latitude: visibleListings[0].lat,
        longitude: visibleListings[0].lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };
    }

    return {
      latitude: 43.6532,
      longitude: -79.3832,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [userLocation, visibleListings]);

  return (
    <SafeAreaView style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {visibleListings.map((item) => (
          <Marker
            key={item.id}
            coordinate={{ latitude: item.lat, longitude: item.lng }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => setSelected(item)}
          >
            <View style={styles.markerContainer}>
              <View style={styles.pill}>
                <Text style={styles.price}>
                  ${item.price?.amount ?? "—"}
                </Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {selected && (
        <Pressable
          style={styles.card}
          onPress={() =>
            navigation.navigate("PropertyDetailsScreen", {
              listing: selected,
            })
          }
        >
          <Text style={styles.title}>{selected.name || "Property"}</Text>

          <Text style={styles.subtitle}>
            ${selected.price?.amount ?? "—"} · {selected.leaseLength || "—"}
          </Text>

          <Text style={styles.city}>{selected.city || "Unknown"}</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  map: {
    width: Dimensions.get("window").width,
    height: "100%",
  },

  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  pill: {
    backgroundColor: "#0D74E7",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fff",
  },

  price: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },

  card: {
    position: "absolute",
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827"
  },

  subtitle: {
    fontSize: 13,
    marginTop: 4,
    color: "#4B5563"
  },

  city: {
    fontSize: 12,
    marginTop: 2,
    color: "#6B7280"
  },
});
