import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { colors } from "../styles/globalStyles";

// AUTH
import OnboardingScreen from "../features/auth/OnboardingScreen";
import LoginScreen from "../features/auth/LoginScreen";
import SignupScreen from "../features/auth/SignupScreen";

// RENTER
import RenterProfileScreen from "../features/renter/RenterProfileScreen";
import RenterPreferencesScreen from "../features/renter/RenterPreferencesScreen";
import RenterTabs from "./RenterTabs";
import MapScreen from "../features/renter/MapScreen";
import SavedListingsScreen from "../features/renter/SavedListingsScreen";
import NotificationsScreen from "../features/renter/NotificationsScreen";
import BookingsListScreen from "../features/renter/BookingsListScreen";
import UserGuideScreen from "../features/renter/UserGuideScreen";
import ConversationsListScreen from "../features/chat/ConversationsListScreen";
import ConversationScreen from "../features/chat/ConversationScreen";
import BookingDetailsScreen from "../features/renter/BookingDetailsScreen";

// LANDLORD
import LandlordTabs from "./LandlordTabs";
import LandlordProfileScreen from "../features/landlord/LandlordProfileScreen";
import AddListingScreen from "../features/landlord/AddListingScreen";
import EditListingScreen from "../features/landlord/EditListingScreen";
import PropertyDetailsScreen from "../features/landlord/PropertyDetailsScreen";
import CreateBookingScreen from "../features/landlord/CreateBookingScreen";

const Stack = createNativeStackNavigator();

type SessionState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "profileUnavailable" }
  | { status: "renter"; hasCompletedPreferences: boolean }
  | { status: "landlord" };

function LoadingScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primaryBlue} />
    </View>
  );
}

function ProfileUnavailableScreen() {
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Profile unavailable</Text>
      <Text style={styles.description}>
        Your account profile could not be loaded. Please sign in again.
      </Text>
      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Back to login</Text>
      </Pressable>
    </View>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeProfile?.();

      if (!user) {
        setSession({ status: "signedOut" });
        return;
      }

      setSession({ status: "loading" });

      unsubscribeProfile = onSnapshot(
        doc(db, "users", user.uid),
        (snapshot) => {
          if (!snapshot.exists()) {
            setSession({ status: "profileUnavailable" });
            return;
          }

          const profile = snapshot.data();

          if (profile.role === "renter") {
            setSession({
              status: "renter",
              hasCompletedPreferences: profile.hasCompletedPreferences === true,
            });
            return;
          }

          if (profile.role === "landlord") {
            setSession({ status: "landlord" });
            return;
          }

          setSession({ status: "profileUnavailable" });
        },
        () => setSession({ status: "profileUnavailable" })
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  if (session.status === "loading") {
    return <LoadingScreen />;
  }

  if (session.status === "profileUnavailable") {
    return <ProfileUnavailableScreen />;
  }

  if (session.status === "signedOut") {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    );
  }

  if (session.status === "renter") {
    return (
      <Stack.Navigator
        key={`renter-${session.hasCompletedPreferences}`}
        initialRouteName={
          session.hasCompletedPreferences
            ? "RenterTabs"
            : "RenterPreferencesScreen"
        }
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="RenterPreferencesScreen" component={RenterPreferencesScreen} />
        <Stack.Screen name="RenterTabs" component={RenterTabs} />
        <Stack.Screen name="RenterProfileScreen" component={RenterProfileScreen} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="SavedListingsScreen" component={SavedListingsScreen} />
        <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
        <Stack.Screen name="UserGuideScreen" component={UserGuideScreen} />
        <Stack.Screen name="ConversationsListScreen" component={ConversationsListScreen} />
        <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
        <Stack.Screen name="BookingDetailsScreen" component={BookingDetailsScreen} />
        <Stack.Screen name="PropertyDetailsScreen" component={PropertyDetailsScreen} />
        <Stack.Screen name="BookingsListScreen" component={BookingsListScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator key="landlord" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LandlordTabs" component={LandlordTabs} />
      <Stack.Screen name="LandlordProfileScreen" component={LandlordProfileScreen} />
      <Stack.Screen name="AddListingScreen" component={AddListingScreen} />
      <Stack.Screen name="EditListingScreen" component={EditListingScreen} />
      <Stack.Screen name="ConversationsListScreen" component={ConversationsListScreen} />
      <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
      <Stack.Screen name="CreateBookingScreen" component={CreateBookingScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7FB",
    padding: 24,
  },
  title: {
    color: colors.black,
    fontSize: 22,
    fontWeight: "800",
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
