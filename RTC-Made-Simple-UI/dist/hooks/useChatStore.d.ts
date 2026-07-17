import { ChatMessage } from "../types/chat.types";
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
export declare const useChatStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ChatStoreState>>;
export {};
//# sourceMappingURL=useChatStore.d.ts.map