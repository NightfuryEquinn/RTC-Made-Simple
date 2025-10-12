"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChatStore = void 0;
const zustand_1 = require("zustand");
exports.useChatStore = (0, zustand_1.create)((set) => ({
    messages: [],
    typingUsers: new Set(),
    connectedUsers: new Set(),
    currentRoom: null,
    currentUser: null,
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
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
    clearMessages: () => set({ messages: [] }),
    reset: () => set({
        messages: [],
        typingUsers: new Set(),
        connectedUsers: new Set(),
        currentRoom: null,
        currentUser: null
    }),
}));
//# sourceMappingURL=useChatStore.js.map