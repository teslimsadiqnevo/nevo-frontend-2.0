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
  latestPreview: string | null;
  lastMessageAt: string;
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

  /** Send, creating the thread if this is the first message. */
  send: (payload: {
    recipientId: string;
    recipientType: RecipientType;
    content: string;
  }) => api.post<ChatMessage>("/api/messages", payload),
};
