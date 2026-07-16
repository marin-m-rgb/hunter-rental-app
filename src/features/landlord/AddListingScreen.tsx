import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { arrayUnion, collection, doc, writeBatch } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db, storage } from "../../config/firebase";
import { colors } from "../../styles/globalStyles";
import {
  LISTING_LEASE_LENGTHS,
  PROPERTY_TYPES,
} from "../shared/listingSchema";

const housingTypes = ["Shared", "Private"];
const pricePeriods = ["per day", "per month"];
const lifestylePreferences = [
  "Quiet",
  "Social",
  "Studious",
  "Night Owl",
  "Clean",
  "Budget-focused",
];

type Coordinates = {
  lat: number;
  lng: number;
};

export default function AddListingScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [sizeSqft, setSizeSqft] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [floor, setFloor] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [housingType, setHousingType] = useState("");
  const [selectedLifestylePreferences, setSelectedLifestylePreferences] =
    useState<string[]>([]);
  const [priceAmount, setPriceAmount] = useState("");
  const [pricePeriod, setPricePeriod] = useState("");
  const [leaseLength, setLeaseLength] = useState("");
  const [images, setImages] = useState(["", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const toggleLifestylePreference = (item: string) => {
    setSelectedLifestylePreferences((current) =>
      current.includes(item)
        ? current.filter((preference) => preference !== item)
        : [...current, item]
    );
  };

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

  const resetForm = () => {
    setName("");
    setAddress("");
    setCity("");
    setDescription("");
    setSizeSqft("");
    setBedrooms("");
    setBathrooms("");
    setFloor("");
    setPropertyType("");
    setHousingType("");
    setSelectedLifestylePreferences([]);
    setPriceAmount("");
    setPricePeriod("");
    setLeaseLength("");
    setImages(["", "", ""]);
  };

  const pickListingImage = async (index: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Allow photo library access to add listing images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const assetUri = result.assets[0].uri;

    setImages((current) => {
      const next = [...current];
      next[index] = assetUri;
      return next;
    });
  };

  const uploadListingImage = async (
    imageUri: string,
    userID: string,
    listingID: string,
    index: number
  ) => {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const imageRef = ref(
      storage,
      `listing-images/${userID}/${listingID}/image-${index + 1}-${Date.now()}.jpg`
    );

    try {
      await uploadBytes(imageRef, blob, {
        contentType: blob.type || "image/jpeg",
      });
    } finally {
      if ("close" in blob && typeof blob.close === "function") {
        blob.close();
      }
    }

    const downloadURL = await getDownloadURL(imageRef);

    return {
      downloadURL,
      path: imageRef.fullPath,
    };
  };

  const handleCreateListing = async () => {
    const user = auth.currentUser;
    const cleanName = name.trim();
    const cleanAddress = address.trim();
    const cleanCity = city.trim();
    const cleanDescription = description.trim();
    const cleanImages = images.map((image) => image.trim());

    const numericSize = Number(sizeSqft);
    const numericBedrooms = Number(bedrooms);
    const numericBathrooms = Number(bathrooms);
    const numericFloor = Number(floor);
    const numericPrice = Number(priceAmount);

    if (!user) {
      setError("Landlord user not found.");
      return;
    }

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
      !housingType ||
      !priceAmount ||
      !pricePeriod ||
      !leaseLength ||
      cleanImages.some((image) => !image)
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
      setLoading(true);
      setError(null);

      const coordinates = await geocodeAddress();

      if (!coordinates) {
        setError("Could not calculate coordinates for this address.");
        return;
      }

      const listingRef = doc(collection(db, "listings"));
      const userRef = doc(db, "users", user.uid);
      const batch = writeBatch(db);
      const uploadedImages: { downloadURL: string; path: string }[] = [];

      try {
        for (let i = 0; i < cleanImages.length; i += 1) {
          uploadedImages.push(
            await uploadListingImage(cleanImages[i], user.uid, listingRef.id, i)
          );
        }
      } catch (uploadError: any) {
        await Promise.all(
          uploadedImages.map((image) => deleteObject(ref(storage, image.path)).catch(() => null))
        );
        throw uploadError;
      }

      batch.set(listingRef, {
        landlordID: user.uid,
        renterID: "",
        name: cleanName,
        address: cleanAddress,
        city: cleanCity,
        description: cleanDescription,
        sizeSqft: numericSize,
        bedrooms: numericBedrooms,
        bathrooms: numericBathrooms,
        floor: numericFloor,
        propertyType,
        housingType,
        lifestylePreferences: selectedLifestylePreferences,
        price: {
          amount: numericPrice,
          period: pricePeriod,
        },
        leaseLength,
        images: uploadedImages.map((image) => image.downloadURL),
        lat: coordinates.lat,
        lng: coordinates.lng,
        status: "Active",
        updatedAt: new Date().toISOString(),
      });

      batch.set(
        userRef,
        {
          listingIDs: arrayUnion(listingRef.id),
        },
        { merge: true }
      );

      await batch.commit();

      resetForm();
      navigation.navigate("LandlordTabs", { screen: "Home" });
    } catch (e: any) {
      setError(e?.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>Add Listing</Text>

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

          <Text style={styles.label}>Housing Type</Text>
          <OptionGroup
            options={housingTypes}
            value={housingType}
            onChange={setHousingType}
          />

          <Text style={styles.label}>Lifestyle</Text>
          <View style={styles.optionGroup}>
            {lifestylePreferences.map((preference) => (
              <TouchableOpacity
                key={preference}
                style={[
                  styles.optionButton,
                  selectedLifestylePreferences.includes(preference) &&
                    styles.optionButtonActive,
                ]}
                onPress={() => toggleLifestylePreference(preference)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedLifestylePreferences.includes(preference) &&
                      styles.optionTextActive,
                  ]}
                >
                  {preference}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          <Text style={styles.label}>Listing Photos</Text>
          <View style={styles.imagePickerGrid}>
            {images.map((imageUri, index) => (
              <TouchableOpacity
                key={`listing-image-${index}`}
                style={styles.imagePickerCard}
                onPress={() => pickListingImage(index)}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderPlus}>+</Text>
                    <Text style={styles.imagePlaceholderText}>
                      Select photo {index + 1}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateListing}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating..." : "Create Listing"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    paddingBottom: 130,
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

  imagePickerGrid: {
    gap: 12,
    marginBottom: 12,
  },

  imagePickerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 180,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  imagePreview: {
    width: "100%",
    height: 180,
  },

  imagePlaceholder: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },

  imagePlaceholderPlus: {
    fontSize: 30,
    lineHeight: 34,
    color: colors.primaryBlue,
    fontWeight: "400",
  },

  imagePlaceholderText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 8,
  },

  button: {
    backgroundColor: colors.deepPurple,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
});
