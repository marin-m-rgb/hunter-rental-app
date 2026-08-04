import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  Conversation,
  FirestoreDate,
  Listing,
  UserProfile,
} from "../shared/types";

export const getDisplayName = (
  profile: UserProfile | null | undefined,
  fallbackEmail = ""
) => {
  const fullName = [profile?.firstName, profile?.lastName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    profile?.name?.trim() ||
    fallbackEmail.split("@")[0] ||
    profile?.email?.split("@")[0] ||
    "User"
  );
};

type ListingWithLegacyOwnerFields = Partial<Listing> & {
  landlordId?: string;
  ownerID?: string;
  ownerId?: string;
  userID?: string;
  userId?: string;
};

export const getListingLandlordId = (listing: ListingWithLegacyOwnerFields | null | undefined) =>
  listing?.landlordID ||
  listing?.landlordId ||
  listing?.ownerID ||
  listing?.ownerId ||
  listing?.userID ||
  listing?.userId ||
  "";

export const buildConversationId = (
  listingId: string,
  renterId: string,
  landlordId: string
) => `${listingId}_${renterId}_${landlordId}`;

export const toDate = (value: FirestoreDate) => {
  if (!value) return null;

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string") return null;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const formatDateTime = (value: FirestoreDate) => {
  const date = toDate(value);

  if (!date) return "Date not set";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getCounterpartyName = (conversation: Conversation, userId: string) =>
  conversation?.renterID === userId
    ? conversation?.landlordName || "Landlord"
    : conversation?.renterName || "Renter";

export const ensureConversation = async ({
  listing,
  landlordID,
  renterID,
  landlordProfile,
  renterProfile,
  landlordEmail,
  renterEmail,
}: {
  listing: Listing;
  landlordID: string;
  renterID: string;
  landlordProfile: UserProfile | null;
  renterProfile: UserProfile | null;
  landlordEmail?: string;
  renterEmail?: string;
}) => {
  const listingId = listing?.id;

  if (!listingId || !landlordID || !renterID) {
    throw new Error("Missing conversation participants.");
  }

  const conversationId = buildConversationId(listingId, renterID, landlordID);
  const conversationRef = doc(db, "conversations", conversationId);
  const conversationSnap = await getDoc(conversationRef);

  const metadata = {
    renterID,
    landlordID,
    participantIDs: [renterID, landlordID],
    listingID: listingId,
    listingName: listing?.name || "Property",
    listingAddress: listing?.address || "",
    listingImage: listing?.images?.[0] || "",
    renterName: getDisplayName(renterProfile, renterEmail),
    landlordName: getDisplayName(landlordProfile, landlordEmail),
  };

  if (!conversationSnap.exists()) {
    await setDoc(conversationRef, {
      ...metadata,
      lastMessageText: "",
      lastMessageSenderID: "",
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return conversationId;
};
