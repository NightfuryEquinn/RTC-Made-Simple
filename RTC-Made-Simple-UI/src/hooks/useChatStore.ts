import { create } from "zustand"
import { ChatMessage } from "../types/chat.types"

type ChatStoreState = {
  messages: ChatMessage[]
  typingUsers: Set<string>
  connectedUsers: Set<string>
  currentRoom: string | null
  currentUser: string | null
  addMessage: (message: ChatMessage) => void
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void
  removeMessage: (messageId: string) => void
  setTypingUser: (userName: string, isTyping: boolean) => void
  addConnectedUser: (userName: string) => void
  removeConnectedUser: (userName: string) => void
  setCurrentRoom: (roomName: string) => void
  setCurrentUser: (userName: string) => void
  clearMessages: () => void
  reset: () => void
}

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [],
  typingUsers: new Set(),
  connectedUsers: new Set(),
  currentRoom: null,
  currentUser: null,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.messageId === messageId ? { ...msg, ...updates } : msg
    )
  })),
  
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((msg) => msg.messageId !== messageId)
  })),
  
  setTypingUser: (userName, isTyping) => set((state) => {
    const newTypingUsers = new Set(state.typingUsers)
    if (isTyping) {
      newTypingUsers.add(userName)
    } else {
      newTypingUsers.delete(userName)
    }
    return { typingUsers: newTypingUsers }
  }),
  
  addConnectedUser: (userName) => set((state) => ({
    connectedUsers: new Set(state.connectedUsers).add(userName)
  })),
  
  removeConnectedUser: (userName) => set((state) => {
    const newConnectedUsers = new Set(state.connectedUsers)
    newConnectedUsers.delete(userName)
    return { connectedUsers: newConnectedUsers }
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
}))
