"use client";

import { useContext } from "react";
import { NotificationContext } from "@/context/NotificationContext";

/** Access notification state — unread count + list (FE Architecture §8). */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (ctx === undefined) {
    throw new Error("useNotifications must be used within <NotificationProvider>");
  }
  return ctx;
}
