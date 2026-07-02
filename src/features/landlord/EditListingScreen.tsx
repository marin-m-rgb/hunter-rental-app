import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { arrayRemove, doc, updateDoc, writeBatch } from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";
import { colors } from "../../styles/globalStyles";
import {
  LISTING_LEASE_LENGTHS,
  PROPERTY_TYPES,
  normalizeLeaseLength,
  normalizePropertyType,
} from "../shared/listingSchema";

const pricePeriods = ["per day", "per month"];
const listingStatuses = ["Active", "Rented", "Inactive"];

type Coordinates = {
  lat: number;
  lng: number;
};

export default function EditListingScreen({ route, navigation }: any) {
  const listing = route?.params?.listing;

  const initialImages = useMemo(
    () => (Array.isArray(listing?.images) ? listing.images : []),
    [listing?.images]
  );

  const [name, setName] = useState(listing?.name || "");
  const [address, setAddress] = useState(listing?.address || "");
  const [city, setCity] = useState(listing?.city || "");
  const [description, setDescription] = useState(listing?.description || "");
  const [sizeSqft, setSizeSqft] = useState(
    listing?.sizeSqft !== undefined ? String(listing.sizeSqft) : ""
  );
  const [bedrooms, setBedrooms] = useState(
    listing?.bedrooms !== undefined ? String(listing.bedrooms) : ""
  );
  const [bathrooms, setBathrooms] = useState(
    listing?.bathrooms !== undefined ? String(listing.bathrooms) : ""
  );
  const [floor, setFloor] = useState(
    listing?.floor !== undefined ? String(listing.floor) : ""
  );
  const [propertyType, setPropertyType] = useState(
    normalizePropertyType(listing?.propertyType) || ""
  );
  const [priceAmount, setPriceAmount] = useState(
    listing?.price?.amount !== undefined ? String(listing.price.amount) : ""
  );
  const [pricePeriod, setPricePeriod] = useState(listing?.price?.period || "");
  const [leaseLength, setLeaseLength] = useState(
    normalizeLeaseLength(listing?.leaseLength) || ""
  );
  const [status, setStatus] = useState(listing?.status || "Active");
  const [image1, setImage1] = useState(initialImages[0] || "");
  const [image2, setImage2] = useState(initialImages[1] || "");
  const [image3, setImage3] = useState(initialImages[2] || "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const OptionGroup = ({
    options,
    value,
    onChange,
  }: {
    options: string[];
    value: string;
    onChange: (nextValue: string) => void;
  }) => (
    <View style={styles.optionGroup}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            value === option && styles.optionButtonActive,
          ]}
          onPress={() => onChange(option)}
        >
          <Text
            style={[
              styles.optionText,
              value === option && styles.optionTextActive,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const geocodeAddress = async (): Promise<Coordinates | null> => {
    const query = encodeURIComponent(`${address.trim()}, ${city.trim()}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`
    );
    const results = await response.json();
    const firstResult = results?.[0];

    if (!firstResult?.lat || !firstResult?.lon) return null;

    const lat = Number(firstResult.lat);
    const lng = Number(firstResult.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  };

  const handleSaveChanges = async () => {
    if (!listing?.id) {
      setError("Listing not found.");
      return;
    }

    const cleanName = name.trim();
    const cleanAddress = address.trim();
    const cleanCity = city.trim();
    const cleanDescription = description.trim();
    const cleanImage1 = image1.trim();
    const cleanImage2 = image2.trim();
    const cleanImage3 = image3.trim();

    const numericSize = Number(sizeSqft);
    const numericBedrooms = Number(bedrooms);
    const numericBathrooms = Number(bathrooms);
    const numericFloor = Number(floor);
    const numericPrice = Number(priceAmount);

    if (
      !cleanName ||
      !cleanAddress ||
      !cleanCity ||
      !cleanDescription ||
      !sizeSqft ||
      !bedrooms ||
      !bathrooms ||
      !floor ||
      !propertyType ||
      !priceAmount ||
      !pricePeriod ||
      !leaseLength ||
      !status ||
      !cleanImage1 ||
      !cleanImage2 ||
      !cleanImage3
    ) {
      setError("All fields are required.");
      return;
    }

    if (
      !Number.isFinite(numericSize) ||
      !Number.isFinite(numericBedrooms) ||
      !Number.isFinite(numericBathrooms) ||
      !Number.isFinite(numericFloor) ||
      !Number.isFinite(numericPrice)
    ) {
      setError("Size, bedrooms, bathrooms, floor, and price must be numbers.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const addressChanged =
        cleanAddress !== listing.address || cleanCity !== listing.city;
      let coordinates: Coordinates | null = null;

      if (addressChanged) {
        coordinates = await geocodeAddress();

        if (!coordinates) {
          setError("Could not calculate coordinates for this address.");
          return;
        }
      }

      await updateDoc(doc(db, "listings", listing.id), {
        name: cleanName,
        address: cleanAddress,
        city: cleanCity,
        description: cleanDescription,
        sizeSqft: numericSize,
        bedrooms: numericBedrooms,
        bathrooms: numericBathrooms,
        floor: numericFloor,
        propertyType,
        price: {
          amount: numericPrice,
          period: pricePeriod,
        },
        leaseLength,
        images: [cleanImage1, cleanImage2, cleanImage3],
        status,
        ...(coordinates
          ? {
              lat: coordinates.lat,
              lng: coordinates.lng,
            }
          : {}),
      });

      navigation.goBack();
    } catch (e: any) {
      setError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteListing = () => {
    Alert.alert(
      "Delete listing",
      "Are you sure you want to delete this listing?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeleteListing,
        },
      ]
    );
  };

  const handleDeleteListing = async () => {
    if (!listing?.id) return;

    try {
      setDeleting(true);
      const user = auth.currentUser;
      const listingOwnerID = listing.landlordID || user?.uid;
      const batch = writeBatch(db);

      batch.delete(doc(db, "listings", listing.id));

      if (listingOwnerID) {
        batch.set(
          doc(db, "users", listingOwnerID),
          {
            listingIDs: arrayRemove(listing.id),
          },
          { merge: true }
        );
      }

      await batch.commit();
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message || "Failed to delete listing.");
    } finally {
      setDeleting(false);
    }
  };

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.error}>Listing not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Edit Listing</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="City"
            value={city}
            onChangeText={setCity}
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Size (sqft)"
            value={sizeSqft}
            onChangeText={setSizeSqft}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Number of bedrooms"
            value={bedrooms}
            onChangeText={setBedrooms}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Number of bathrooms"
            value={bathrooms}
            onChangeText={setBathrooms}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Floor"
            value={floor}
            onChangeText={setFloor}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Type of property</Text>
          <OptionGroup
            options={[...PROPERTY_TYPES]}
            value={propertyType}
            onChange={setPropertyType}
          />

          <TextInput
            style={styles.input}
            placeholder="Price"
            value={priceAmount}
            onChangeText={setPriceAmount}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Price period</Text>
          <OptionGroup
            options={pricePeriods}
            value={pricePeriod}
            onChange={setPricePeriod}
          />

          <Text style={styles.label}>Lease Length</Text>
          <OptionGroup
            options={[...LISTING_LEASE_LENGTHS]}
            value={leaseLength}
            onChange={setLeaseLength}
          />

          <Text style={styles.label}>Status</Text>
          <OptionGroup
            options={listingStatuses}
            value={status}
            onChange={setStatus}
          />

          <TextInput
            style={styles.input}
            placeholder="Image 1"
            value={image1}
            onChangeText={setImage1}
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Image 2"
            value={image2}
            onChangeText={setImage2}
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="Image 3"
            value={image3}
            onChangeText={setImage3}
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSaveChanges}
            disabled={saving || deleting}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save changes"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.disabledButton]}
            onPress={confirmDeleteListing}
            disabled={saving || deleting}
          >
            <Text style={styles.deleteButtonText}>
              {deleting ? "Deleting..." : "Delete listing"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 160,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 18,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
    color: "#111827",
  },

  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },

  optionButton: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },

  optionButtonActive: {
    backgroundColor: "#E5EBFB",
    borderColor: colors.primaryBlue,
  },

  optionText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "600",
  },

  optionTextActive: {
    color: colors.primaryBlue,
    fontWeight: "800",
  },

  error: {
    color: "#DC2626",
    marginBottom: 12,
    fontWeight: "600",
  },

  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    padding: 16,
    gap: 10,
  },

  saveButton: {
    backgroundColor: colors.deepPurple,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#DC2626",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 16,
  },

  disabledButton: {
    opacity: 0.7,
  },
});
