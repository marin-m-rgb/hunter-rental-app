import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

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

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* AUTH */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="RenterProfileScreen" component={RenterProfileScreen} />

      {/* RENTER FLOW */}
      <Stack.Screen name="RenterPreferencesScreen" component={RenterPreferencesScreen} />
      <Stack.Screen name="RenterTabs" component={RenterTabs} />
      <Stack.Screen name="MapScreen" component={MapScreen} />
      <Stack.Screen name="SavedListingsScreen" component={SavedListingsScreen} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="UserGuideScreen" component={UserGuideScreen} />
      <Stack.Screen name="ConversationsListScreen" component={ConversationsListScreen} />
      <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
      <Stack.Screen name="BookingDetailsScreen" component={BookingDetailsScreen} />

      {/* LANDLORD & BOOKINGS */}
      <Stack.Screen name="LandlordTabs" component={LandlordTabs} />
      <Stack.Screen name="LandlordProfileScreen" component={LandlordProfileScreen} />
      <Stack.Screen name="AddListingScreen" component={AddListingScreen} />
      <Stack.Screen name="EditListingScreen" component={EditListingScreen} />
      <Stack.Screen name="PropertyDetailsScreen" component={PropertyDetailsScreen} />
      <Stack.Screen name="BookingsListScreen" component={BookingsListScreen} />
      <Stack.Screen name="CreateBookingScreen" component={CreateBookingScreen} />

    </Stack.Navigator>
  );
}
