import { api } from "./client";

/**
 * Connect messaging - threads between a teacher and their students.
 *
 * `recipientType` is `student` or `class`; the backend finds or creates the
 * matching school-scoped thread on send, so there is no "create thread" call.
 * A thread's `title` is the only name it carries - there is no class on the
 * thread, and no avatar.
 *
 * camelCase, like the rest of the v2 product surface.
 */

export type RecipientType = "student" | "class";

export interface MessageThread {
  threadId: string;
  recipientType: RecipientType | (string & {});
  recipientId: string | null;
  title: string;
  /** The class this thread belongs to. Shipped 31 Aug. */
  className: string | null;
  latestPreview: string | null;
  lastMessageAt: string;
  /** Anything unread in this thread. Shipped 31 Aug. */
  unread: boolean;
  /** How many. Shipped 31 Aug. */
  unreadCount: number;
}

export interface ThreadList {
  threads: MessageThread[];
  total: number;
}

export interface ChatMessage {
  messageId: string;
  threadId: string;
  /** Null for system-authored messages. */
  senderId: string | null;
  senderName: string | null;
  content: string;
  createdAt: string;
}

export interface ThreadMessages {
  threadId: string;
  messages: ChatMessage[];
}

export const messagesApi = {
  /** The teacher's conversations. GET /api/messages/threads */
  threads: () => api.get<ThreadList>("/api/messages/threads"),

  /** One thread, chronological. */
  thread: (threadId: string) =>
    api.get<ThreadMessages>(`/api/messages/threads/${threadId}`),

  /**
   * Mark one thread read, returning the updated thread.
   *
   * Shipped 1 Sep. It exists BECAUSE fetching a thread already marked it read
   * server-side, and clearing a badge should not be a side effect of a GET
   * that a prefetch can fire. The response is the whole thread, so the badge
   * reconciles without a second round trip.
   */
  markThreadRead: (threadId: string) =>
    api.post<MessageThread>(`/api/messages/threads/${threadId}/read`),

  /** Send, creating the thread if this is the first message. */
  send: (payload: {
    recipientId: string;
    recipientType: RecipientType;
    content: string;
  }) => api.post<ChatMessage>("/api/messages", payload),
};
