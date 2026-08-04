import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { getUserLocation } from "./utils/location";
import { Listing, toListing } from "../shared/types";

export default function MapScreen({ navigation }: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

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
      try {
        setLoading(true);
        setLoadError(null);
        setSelected(null);

        const snap = await getDocs(
          query(collection(db, "listings"), where("status", "==", "Active"))
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

    loadListings();
  }, [reloadToken]);

  // VALID COORDS 
  const validListings = useMemo(() => {
    return listings.filter(
      (l): l is Listing & { lat: number; lng: number } =>
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

  useEffect(() => {
    if (!mapReady || !userLocation) return;

    mapRef.current?.animateToRegion(
      {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      },
      400
    );
  }, [mapReady, userLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
      >
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

      {loading ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color="#0D74E7" />
          <Text style={styles.overlayText}>Loading listings...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>{loadError}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => setReloadToken((current) => current + 1)}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : visibleListings.length === 0 ? (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>No active listings to show yet.</Text>
        </View>
      ) : null}

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

  overlay: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    bottom: 120,
    left: 16,
    padding: 14,
    position: "absolute",
    right: 16,
  },

  overlayText: {
    color: "#4B5563",
    lineHeight: 20,
    textAlign: "center",
  },

  retryButton: {
    backgroundColor: "#0D74E7",
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
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
