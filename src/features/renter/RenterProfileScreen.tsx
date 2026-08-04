import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../config/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { colors, buttons } from "../../styles/globalStyles";
import { normalizeRenterPreferences } from "../shared/listingSchema";
import { CAMPUSES } from "./data/campuses";

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default function RenterProfileScreen({ navigation }: any) {
  const [prefs, setPrefs] = useState<any>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);

  const user = auth.currentUser;

  const campusLabel =
    CAMPUSES.find((c) => c.id === prefs?.campusId)?.name ?? "Not selected";

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data();
        setPrefs(normalizeRenterPreferences(data?.renterPreferences || null));
        setName(data?.name || "User");
        setPhoneNumber(data?.phoneNumber || "");
        setAvatarUrl(data?.avatarUrl || null);
      }
    };

    load();
  }, [user]);

  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");
    return { firstName, lastName };
  };

  const updateSharedProfile = async (
    userPayload: Record<string, any>,
    sharedPayload: Record<string, any>
  ) => {
    if (!user) return;

    const batch = writeBatch(db);
    batch.set(doc(db, "users", user.uid), userPayload, { merge: true });

    if (Object.keys(sharedPayload).length > 0) {
      batch.set(doc(db, "sharedUsers", user.uid), sharedPayload, { merge: true });
    }

    await batch.commit();
  };

  const uploadAvatarImage = async (imageUri: string) => {
    if (!user) {
      throw new Error("User not found.");
    }

    const response = await fetch(imageUri);
    const blob = await response.blob();
    const avatarRef = ref(
      storage,
      `avatar-images/${user.uid}/avatar-${Date.now()}.jpg`
    );

    try {
      await uploadBytes(avatarRef, blob, {
        contentType: blob.type || "image/jpeg",
      });
    } finally {
      if ("close" in blob && typeof blob.close === "function") {
        blob.close();
      }
    }

    return getDownloadURL(avatarRef);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const previousAvatarUrl = avatarUrl;

      try {
        const localUri = result.assets[0].uri;

        setAvatarUrl(localUri);

        const uploadedAvatarUrl = await uploadAvatarImage(localUri);

        await updateSharedProfile(
          { avatarUrl: uploadedAvatarUrl },
          { avatarUrl: uploadedAvatarUrl }
        );

        setAvatarUrl(uploadedAvatarUrl);
      } catch (e: any) {
        setAvatarUrl(previousAvatarUrl);
        Alert.alert(
          "Avatar upload failed",
          e?.message || "Could not upload avatar."
        );
      }
    }
  };

  const saveName = async () => {
    const cleanName = name.trim();
    const { firstName, lastName } = splitName(cleanName);

    setEditingName(false);
    setName(cleanName);

    await updateSharedProfile(
      { name: cleanName, firstName, lastName },
      { firstName, lastName }
    );
  };

  const savePhoneNumber = async () => {
    const cleanPhoneNumber = phoneNumber.trim();

    setPhoneNumber(cleanPhoneNumber);

    await updateSharedProfile(
      { phoneNumber: cleanPhoneNumber },
      {}
    );
  };

  const logout = () => {
    Alert.alert("Log out", "Do you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {editingName ? (
            <View style={styles.nameRow}>
              <TextInput value={name} onChangeText={setName} style={styles.input} />
              <TouchableOpacity onPress={saveName}>
                <Text style={styles.save}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)}>
              <Text style={styles.title}>{name}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.subtitle}>Tap avatar or name to edit</Text>
        </View>

        {/* CONTACT */}
        <View style={styles.card}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="Enter phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={styles.savePhoneButton} onPress={savePhoneNumber}>
            <Text style={styles.savePhoneText}>Save Phone</Text>
          </TouchableOpacity>
        </View>

        {/* PREFERENCES */}
        <View style={styles.card}>
          {!prefs ? (
            <Text style={styles.empty}>No preferences set</Text>
          ) : (
            <>
              <InfoRow label="Budget" value={`$${prefs.budget ?? "Not set"}`} />
              <InfoRow label="Campus" value={campusLabel} />
              <InfoRow
                label="Property Type"
                value={prefs.propertyTypes?.length ? prefs.propertyTypes.join(", ") : "Any"}
              />
              <InfoRow
                label="Lease Length"
                value={prefs.leaseLengths?.length ? prefs.leaseLengths.join(", ") : "Any"}
              />
              <InfoRow
                label="Housing Type"
                value={prefs.housingTypes?.length ? prefs.housingTypes.join(", ") : "Any"}
              />
              <InfoRow label="Max Distance" value={`${prefs.maxDistanceKm ?? 0} km`} />
              <InfoRow
                label="Lifestyle"
                value={
                  prefs.lifestylePreferences?.length
                    ? prefs.lifestylePreferences.join(", ")
                    : "None selected"
                }
              />
            </>
          )}
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={buttons.primary}
            onPress={() => navigation.navigate("RenterPreferencesScreen")}
          >
            <Text style={buttons.primaryText}>Edit Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttons.secondary, styles.actionSpacing]}
            onPress={() => navigation.navigate("UserGuideScreen")}
          >
            <Text style={buttons.secondaryText}>User Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttons.secondary, styles.actionSpacing]}
            onPress={logout}
          >
            <Text style={buttons.secondaryText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },

  content: {
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 24,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.deepPurple,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "800"
  },

  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    minWidth: 120,
    textAlign: "center",
  },

  phoneInput: {
    borderBottomWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
  },

  save: {
    color: colors.deepPurple,
    fontWeight: "700",
  },

  savePhoneButton: {
    marginTop: 12,
    alignSelf: "flex-start",
  },

  savePhoneText: {
    color: colors.deepPurple,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },

  infoRow: {
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  value: {
    fontSize: 14,
    color: "#4B5563",
  },

  empty: {
    textAlign: "center",
    color: "#9CA3AF"
  },

  actions: {
    marginTop: 10,
  },

  actionSpacing: {
    marginTop: 12,
  },
});
