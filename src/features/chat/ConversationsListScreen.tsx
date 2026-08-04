import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { colors } from "../../styles/globalStyles";
import {
  getCounterpartyName,
  formatDateTime,
  toDate,
} from "./chatHelpers";
import { Conversation, toConversation } from "../shared/types";

export default function ConversationsListScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participantIDs", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snap) => {
        const nextConversations = snap.docs
          .flatMap((docSnap) => {
            const conversation = toConversation(docSnap.id, docSnap.data());
            return conversation ? [conversation] : [];
          })
          .sort((a, b) => {
            const left =
              toDate(a.updatedAt)?.getTime() ||
              toDate(a.lastMessageAt)?.getTime() ||
              toDate(a.createdAt)?.getTime() ||
              0;
            const right =
              toDate(b.updatedAt)?.getTime() ||
              toDate(b.lastMessageAt)?.getTime() ||
              toDate(b.createdAt)?.getTime() ||
              0;

            return right - left;
          });

        setConversations(nextConversations);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Chats</Text>

      {conversations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No chats yet</Text>
          <Text style={styles.emptyText}>
            Open a listing and start a conversation with the landlord.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("ConversationScreen", {
                  conversationId: item.id,
                })
              }
            >
              {item.listingImage ? (
                <Image source={{ uri: item.listingImage }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Chat</Text>
                </View>
              )}

              <View style={styles.cardContent}>
                <View style={styles.row}>
                  <Text style={styles.listingName} numberOfLines={1}>
                    {item.listingName || "Property"}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatDateTime(item.lastMessageAt || item.createdAt)}
                  </Text>
                </View>

                <Text style={styles.address} numberOfLines={1}>
                  {item.listingAddress || "Address unavailable"}
                </Text>

                <Text style={styles.counterparty} numberOfLines={1}>
                  {getCounterpartyName(item, user?.uid || "")}
                </Text>

                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessageText?.trim() || "Open conversation"}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    paddingHorizontal: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.black,
    marginTop: 10,
    marginBottom: 12,
  },

  listContent: {
    paddingBottom: 120,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },

  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
  },

  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#E5EBFB",
    alignItems: "center",
    justifyContent: "center",
  },

  imagePlaceholderText: {
    color: colors.primaryBlue,
    fontWeight: "700",
  },

  cardContent: {
    flex: 1,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  listingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: colors.black,
  },

  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  address: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  counterparty: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },

  preview: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 6,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 6,
  },

  emptyText: {
    color: colors.textSecondary,
    lineHeight: 20,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7FB",
  },
});
