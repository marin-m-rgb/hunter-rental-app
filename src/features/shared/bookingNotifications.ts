import { collection, doc, serverTimestamp, writeBatch, WriteBatch } from "firebase/firestore";
import { db } from "../../config/firebase";
import { BookingStatus } from "./types";

export const addBookingNotification = (
  batch: WriteBatch,
  params: {
    recipientId: string;
    bookingId: string;
    listingId: string;
    title: string;
    status: BookingStatus;
  }
) => {
  const bodyByStatus: Record<BookingStatus, string> = {
    pending: "A viewing has been scheduled.",
    accepted: "Your viewing request was accepted.",
    rejected: "Your viewing request was rejected.",
    completed: "Your viewing was completed.",
    cancelled: "The viewing request was cancelled.",
  };

  batch.set(doc(collection(db, "notifications")), {
    userId: params.recipientId,
    bookingId: params.bookingId,
    listingId: params.listingId,
    type: "booking_status",
    title: params.title,
    body: bodyByStatus[params.status],
    status: params.status,
    createdAt: serverTimestamp(),
    readAt: null,
    dismissedAt: null,
  });
};

export const createBookingBatch = () => writeBatch(db);
