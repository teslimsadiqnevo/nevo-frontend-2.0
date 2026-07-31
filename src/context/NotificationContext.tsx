"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface NotificationItem {
  id: string;
  /** Plain-language line ("A new lesson is ready for you"). */
  text: string;
  /** Compact age label ("2h", "1d") - backend-computed later. */
  ago: string;
  read?: boolean;
  // TODO: type per role (Student B.13 / Teacher C.13 / Admin D.13).
}

export interface NotificationContextValue {
  unreadCount: number;
  notifications: NotificationItem[];
  refresh: () => void;
}

export const NotificationContext = createContext<
  NotificationContextValue | undefined
>(undefined);

// Board 28's demo items. TODO(api): notificationsApi feed.
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", text: "A new lesson is ready for you", ago: "2h" },
  { id: "n2", text: "Ms Okafor sent you a message", ago: "1d", read: true },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [unreadCount] = useState(
    MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
  );

  const refresh = useCallback(() => {
    // TODO: re-fetch via notificationsApi and update state (polling/subscription).
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({ unreadCount, notifications, refresh }),
    [unreadCount, notifications, refresh],
  );
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
