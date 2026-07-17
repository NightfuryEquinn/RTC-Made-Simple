import { create } from "zustand";
import { ChatMessage } from "../types/chat.types";

const DEFAULT_MAX_MESSAGES = 200;

type ChatStoreState = {
  messages: ChatMessage[];
  typingUsers: Set<string>;
  connectedUsers: Set<string>;
  currentRoom: string | null;
  currentUser: string | null;
  maxMessages: number;
  connectionError: string | null;
  isConnected: boolean;
  addMessage: (message: ChatMessage) => void;
  reconcileMessage: (clientMessageId: string, message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (messageId: string) => void;
  setTypingUser: (userName: string, isTyping: boolean) => void;
  addConnectedUser: (userName: string) => void;
  removeConnectedUser: (userName: string) => void;
  setCurrentRoom: (roomName: string) => void;
  setCurrentUser: (userName: string) => void;
  setMaxMessages: (maxMessages: number) => void;
  setConnectionError: (error: string | null) => void;
  setIsConnected: (connected: boolean) => void;
  clearMessages: () => void;
  reset: () => void;
};

const trimMessages = (messages: ChatMessage[], maxMessages: number) => {
  if (messages.length <= maxMessages) {
    return messages;
  }
  return messages.slice(messages.length - maxMessages);
};

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [],
  typingUsers: new Set(),
  connectedUsers: new Set(),
  currentRoom: null,
  currentUser: null,
  maxMessages: DEFAULT_MAX_MESSAGES,
  connectionError: null,
  isConnected: false,

  addMessage: (message) =>
    set((state) => ({
      messages: trimMessages([...state.messages, message], state.maxMessages)
    })),

  reconcileMessage: (clientMessageId, message) =>
    set((state) => {
      const index = state.messages.findIndex(
        (msg) =>
          msg.messageId === clientMessageId ||
          msg.clientMessageId === clientMessageId
      );

      if (index === -1) {
        return {
          messages: trimMessages([...state.messages, message], state.maxMessages)
        };
      }

      const next = [...state.messages];
      next[index] = {
        ...next[index],
        ...message,
        clientMessageId
      };
      return { messages: next };
    }),

  setMessages: (messages) =>
    set((state) => ({
      messages: trimMessages(messages, state.maxMessages)
    })),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.messageId === messageId ? { ...msg, ...updates } : msg
      )
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.messageId !== messageId)
    })),

  setTypingUser: (userName, isTyping) =>
    set((state) => {
      const newTypingUsers = new Set(state.typingUsers);
      if (isTyping) {
        newTypingUsers.add(userName);
      } else {
        newTypingUsers.delete(userName);
      }
      return { typingUsers: newTypingUsers };
    }),

  addConnectedUser: (userName) =>
    set((state) => ({
      connectedUsers: new Set(state.connectedUsers).add(userName)
    })),

  removeConnectedUser: (userName) =>
    set((state) => {
      const newConnectedUsers = new Set(state.connectedUsers);
      newConnectedUsers.delete(userName);
      return { connectedUsers: newConnectedUsers };
    }),

  setCurrentRoom: (roomName) => set({ currentRoom: roomName }),
  setCurrentUser: (userName) => set({ currentUser: userName }),
  setMaxMessages: (maxMessages) => set({ maxMessages }),
  setConnectionError: (error) => set({ connectionError: error }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  clearMessages: () => set({ messages: [] }),

  reset: () =>
    set({
      messages: [],
      typingUsers: new Set(),
      connectedUsers: new Set(),
      currentRoom: null,
      currentUser: null,
      connectionError: null,
      isConnected: false
    })
}));
