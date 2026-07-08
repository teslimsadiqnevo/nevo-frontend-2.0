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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications] = useState<NotificationItem[]>([]);
  const [unreadCount] = useState(0);

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
