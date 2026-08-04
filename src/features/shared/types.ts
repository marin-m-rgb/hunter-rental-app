import type { Timestamp } from "firebase/firestore";

export type FirestoreDate = Timestamp | Date | string | null | undefined;

export type UserRole = "renter" | "landlord";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export type ListingStatus = "Active" | "Rented" | "Inactive";

export type Price = {
  amount: number;
  period: string;
};

export type Listing = {
  id: string;
  landlordID: string;
  renterID?: string;
  name: string;
  address: string;
  city: string;
  description?: string;
  sizeSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  propertyType?: string | null;
  housingType?: string | null;
  leaseLength?: string | null;
  lifestylePreferences?: string[];
  furnished?: boolean;
  price?: Price;
  images?: string[];
  lat?: number;
  lng?: number;
  status?: ListingStatus;
  distance?: number | null;
};

export type UserProfile = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: UserRole;
};

export type Conversation = {
  id: string;
  renterID: string;
  landlordID: string;
  participantIDs: string[];
  listingID: string;
  listingName?: string;
  listingAddress?: string;
  listingImage?: string;
  renterName?: string;
  landlordName?: string;
  lastMessageText?: string;
  lastMessageSenderID?: string;
  lastMessageAt?: FirestoreDate;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
};

export type ChatMessage = {
  id: string;
  senderID: string;
  text: string;
  createdAt?: FirestoreDate;
};

export type Booking = {
  id: string;
  landlordID: string;
  renterID: string;
  conversationID: string;
  listingID: string;
  listingTitle?: string;
  listingName?: string;
  listingAddress?: string;
  listingImage?: string;
  renterName?: string;
  landlordName?: string;
  scheduledAt?: FirestoreDate;
  status: BookingStatus;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringValue = (record: Record<string, unknown>, key: string) =>
  typeof record[key] === "string" ? record[key] : undefined;

const numberValue = (record: Record<string, unknown>, key: string) =>
  typeof record[key] === "number" && Number.isFinite(record[key])
    ? record[key]
    : undefined;

const stringArrayValue = (record: Record<string, unknown>, key: string) =>
  Array.isArray(record[key])
    ? record[key].filter((value): value is string => typeof value === "string")
    : undefined;

export const toListing = (id: string, value: unknown): Listing | null => {
  if (!isRecord(value)) return null;

  const landlordID = stringValue(value, "landlordID");
  const name = stringValue(value, "name");
  const address = stringValue(value, "address");
  const city = stringValue(value, "city");

  if (!landlordID || !name || !address || !city) return null;

  const rawPrice = isRecord(value.price) ? value.price : null;
  const priceAmount = rawPrice ? numberValue(rawPrice, "amount") : undefined;
  const pricePeriod = rawPrice ? stringValue(rawPrice, "period") : undefined;
  const status = stringValue(value, "status");

  return {
    id,
    landlordID,
    renterID: stringValue(value, "renterID"),
    name,
    address,
    city,
    description: stringValue(value, "description"),
    sizeSqft: numberValue(value, "sizeSqft"),
    bedrooms: numberValue(value, "bedrooms"),
    bathrooms: numberValue(value, "bathrooms"),
    floor: numberValue(value, "floor"),
    propertyType: stringValue(value, "propertyType"),
    housingType: stringValue(value, "housingType"),
    leaseLength: stringValue(value, "leaseLength"),
    lifestylePreferences: stringArrayValue(value, "lifestylePreferences"),
    furnished: typeof value.furnished === "boolean" ? value.furnished : undefined,
    price:
      priceAmount !== undefined && pricePeriod !== undefined
        ? { amount: priceAmount, period: pricePeriod }
        : undefined,
    images: stringArrayValue(value, "images"),
    lat: numberValue(value, "lat"),
    lng: numberValue(value, "lng"),
    status:
      status === "Active" || status === "Rented" || status === "Inactive"
        ? status
        : undefined,
  };
};

export const toUserProfile = (value: unknown): UserProfile | null => {
  if (!isRecord(value)) return null;

  const role = stringValue(value, "role");

  return {
    firstName: stringValue(value, "firstName"),
    lastName: stringValue(value, "lastName"),
    name: stringValue(value, "name"),
    email: stringValue(value, "email"),
    phoneNumber: stringValue(value, "phoneNumber"),
    avatarUrl: stringValue(value, "avatarUrl"),
    role: role === "renter" || role === "landlord" ? role : undefined,
  };
};

export const toConversation = (
  id: string,
  value: unknown
): Conversation | null => {
  if (!isRecord(value)) return null;

  const renterID = stringValue(value, "renterID");
  const landlordID = stringValue(value, "landlordID");
  const listingID = stringValue(value, "listingID");
  const participantIDs = stringArrayValue(value, "participantIDs");

  if (
    !renterID ||
    !landlordID ||
    !listingID ||
    !participantIDs ||
    participantIDs.length !== 2 ||
    !participantIDs.includes(renterID) ||
    !participantIDs.includes(landlordID)
  ) {
    return null;
  }

  return {
    id,
    renterID,
    landlordID,
    participantIDs,
    listingID,
    listingName: stringValue(value, "listingName"),
    listingAddress: stringValue(value, "listingAddress"),
    listingImage: stringValue(value, "listingImage"),
    renterName: stringValue(value, "renterName"),
    landlordName: stringValue(value, "landlordName"),
    lastMessageText: stringValue(value, "lastMessageText"),
    lastMessageSenderID: stringValue(value, "lastMessageSenderID"),
    lastMessageAt: value.lastMessageAt as FirestoreDate,
    createdAt: value.createdAt as FirestoreDate,
    updatedAt: value.updatedAt as FirestoreDate,
  };
};

export const toChatMessage = (id: string, value: unknown): ChatMessage | null => {
  if (!isRecord(value)) return null;

  const senderID = stringValue(value, "senderID");
  const text = stringValue(value, "text");

  if (!senderID || !text) return null;

  return {
    id,
    senderID,
    text,
    createdAt: value.createdAt as FirestoreDate,
  };
};

export const toBooking = (id: string, value: unknown): Booking | null => {
  if (!isRecord(value)) return null;

  const landlordID = stringValue(value, "landlordID");
  const renterID = stringValue(value, "renterID");
  const conversationID = stringValue(value, "conversationID");
  const listingID = stringValue(value, "listingID");
  const status = stringValue(value, "status");

  if (
    !landlordID ||
    !renterID ||
    !conversationID ||
    !listingID ||
    (status !== "pending" &&
      status !== "accepted" &&
      status !== "rejected" &&
      status !== "completed" &&
      status !== "cancelled")
  ) {
    return null;
  }

  return {
    id,
    landlordID,
    renterID,
    conversationID,
    listingID,
    listingTitle: stringValue(value, "listingTitle"),
    listingName: stringValue(value, "listingName"),
    listingAddress: stringValue(value, "listingAddress"),
    listingImage: stringValue(value, "listingImage"),
    renterName: stringValue(value, "renterName"),
    landlordName: stringValue(value, "landlordName"),
    scheduledAt: value.scheduledAt as FirestoreDate,
    status,
    createdAt: value.createdAt as FirestoreDate,
    updatedAt: value.updatedAt as FirestoreDate,
  };
};
