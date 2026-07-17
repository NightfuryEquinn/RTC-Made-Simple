"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChatStore = void 0;
const zustand_1 = require("zustand");
const DEFAULT_MAX_MESSAGES = 200;
const trimMessages = (messages, maxMessages) => {
    if (messages.length <= maxMessages) {
        return messages;
    }
    return messages.slice(messages.length - maxMessages);
};
exports.useChatStore = (0, zustand_1.create)((set) => ({
    messages: [],
    typingUsers: new Set(),
    connectedUsers: new Set(),
    currentRoom: null,
    currentUser: null,
    maxMessages: DEFAULT_MAX_MESSAGES,
    connectionError: null,
    isConnected: false,
    addMessage: (message) => set((state) => ({
        messages: trimMessages([...state.messages, message], state.maxMessages)
    })),
    reconcileMessage: (clientMessageId, message) => set((state) => {
        const index = state.messages.findIndex((msg) => msg.messageId === clientMessageId ||
            msg.clientMessageId === clientMessageId);
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
    setMessages: (messages) => set((state) => ({
        messages: trimMessages(messages, state.maxMessages)
    })),
    updateMessage: (messageId, updates) => set((state) => ({
        messages: state.messages.map((msg) => msg.messageId === messageId ? { ...msg, ...updates } : msg)
    })),
    removeMessage: (messageId) => set((state) => ({
        messages: state.messages.filter((msg) => msg.messageId !== messageId)
    })),
    setTypingUser: (userName, isTyping) => set((state) => {
        const newTypingUsers = new Set(state.typingUsers);
        if (isTyping) {
            newTypingUsers.add(userName);
        }
        else {
            newTypingUsers.delete(userName);
        }
        return { typingUsers: newTypingUsers };
    }),
    addConnectedUser: (userName) => set((state) => ({
        connectedUsers: new Set(state.connectedUsers).add(userName)
    })),
    removeConnectedUser: (userName) => set((state) => {
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
    reset: () => set({
        messages: [],
        typingUsers: new Set(),
        connectedUsers: new Set(),
        currentRoom: null,
        currentUser: null,
        connectionError: null,
        isConnected: false
    })
}));
//# sourceMappingURL=useChatStore.js.map