import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { buttons, colors } from "../../styles/globalStyles";
import { formatDateTime, getCounterpartyName } from "./chatHelpers";
import { ChatMessage, Conversation, toChatMessage, toConversation } from "../shared/types";

export default function ConversationScreen({ navigation, route }: any) {
  const conversationId = route?.params?.conversationId;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!conversationId || !user) {
      setLoading(false);
      return;
    }

    const conversationRef = doc(db, "conversations", conversationId);
    const messagesQuery = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribeConversation = onSnapshot(
      conversationRef,
      (snap) => {
        setConversation(snap.exists() ? toConversation(snap.id, snap.data()) : null);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snap) => {
      setMessages(
        snap.docs.flatMap((docSnap) => {
          const message = toChatMessage(docSnap.id, docSnap.data());
          return message ? [message] : [];
        })
      );
    });

    return () => {
      unsubscribeConversation();
      unsubscribeMessages();
    };
  }, [conversationId, user]);

  const handleSend = async () => {
    const cleanMessage = message.trim();

    if (!user || !conversationId || !cleanMessage || sending) return;

    try {
      setSending(true);

      const conversationRef = doc(db, "conversations", conversationId);
      const messageRef = doc(collection(db, "conversations", conversationId, "messages"));
      const batch = writeBatch(db);

      batch.set(messageRef, {
        senderID: user.uid,
        text: cleanMessage,
        createdAt: serverTimestamp(),
      });

      batch.set(
        conversationRef,
        {
          lastMessageText: cleanMessage,
          lastMessageSenderID: user.uid,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </SafeAreaView>
    );
  }

  if (!conversation || !user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>Conversation unavailable.</Text>
      </SafeAreaView>
    );
  }

  const isLandlord = conversation.landlordID === user.uid;
  const counterpartyName = getCounterpartyName(conversation, user.uid);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{counterpartyName}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {conversation.listingName || "Property"} ·{" "}
              {conversation.listingAddress || "Address unavailable"}
            </Text>
          </View>
        </View>

        {isLandlord ? (
          <View style={styles.bookingCtaWrap}>
            <Pressable
              style={styles.bookingCta}
              onPress={() =>
                navigation.navigate("CreateBookingScreen", {
                  conversationId,
                })
              }
            >
              <Text style={styles.bookingCtaText}>Create Booking</Text>
            </Pressable>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => {
            const isOwnMessage = item.senderID === user.uid;

            return (
              <View
                style={[
                  styles.messageRow,
                  isOwnMessage ? styles.messageRowOwn : styles.messageRowOther,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isOwnMessage && styles.messageTextOwn,
                    ]}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isOwnMessage && styles.messageTimeOwn,
                    ]}
                  >
                    {formatDateTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>
                Start the conversation about this listing here.
              </Text>
            </View>
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Write a message"
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <Pressable
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
            <Text style={buttons.primaryText}>
              {sending ? "..." : "Send"}
            </Text>
          </Pressable>
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backButtonText: {
    fontSize: 32,
    lineHeight: 34,
    color: "#111827",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.black,
  },

  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  bookingCtaWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  bookingCta: {
    backgroundColor: "#E5EBFB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  bookingCtaText: {
    color: colors.primaryBlue,
    fontWeight: "800",
    fontSize: 14,
  },

  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },

  messageRow: {
    flexDirection: "row",
  },

  messageRowOwn: {
    justifyContent: "flex-end",
  },

  messageRowOther: {
    justifyContent: "flex-start",
  },

  messageBubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  messageBubbleOwn: {
    backgroundColor: colors.deepPurple,
  },

  messageBubbleOther: {
    backgroundColor: "#fff",
  },

  messageText: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 20,
  },

  messageTextOwn: {
    color: "#fff",
  },

  messageTime: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 6,
  },

  messageTimeOwn: {
    color: "#D9D8FF",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#fff",
    gap: 10,
  },

  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 110,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#111827",
    textAlignVertical: "top",
  },

  sendButton: {
    ...buttons.primary,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  sendButtonDisabled: {
    opacity: 0.7,
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
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
    textAlign: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7FB",
    paddingHorizontal: 20,
  },
});
