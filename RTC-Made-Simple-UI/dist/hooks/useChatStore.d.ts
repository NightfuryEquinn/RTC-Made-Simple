import { ChatMessage } from "../types/chat.types";
type ChatStoreState = {
    messages: ChatMessage[];
    typingUsers: Set<string>;
    connectedUsers: Set<string>;
    currentRoom: string | null;
    currentUser: string | null;
    addMessage: (message: ChatMessage) => void;
    updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
    removeMessage: (messageId: string) => void;
    setTypingUser: (userName: string, isTyping: boolean) => void;
    addConnectedUser: (userName: string) => void;
    removeConnectedUser: (userName: string) => void;
    setCurrentRoom: (roomName: string) => void;
    setCurrentUser: (userName: string) => void;
    clearMessages: () => void;
    reset: () => void;
};
export declare const useChatStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ChatStoreState>>;
export {};
//# sourceMappingURL=useChatStore.d.ts.map