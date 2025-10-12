import { useCallback, useEffect, useRef } from "react"
import { createChatSocket, getChatSocket } from "../socket"
import { 
  ChatMessage, 
  UserJoinedData, 
  UserLeftData, 
  UserTypingData, 
  MessageReadReceiptData,
  MessageDeletedData 
} from "../types/chat.types"
import { useChatStore } from "./useChatStore"

interface UseChatSocketProps {
  userName: string
  roomName: string
  baseUrl: string
  onMessageReceived?: (message: ChatMessage) => void
  onUserJoined?: (data: UserJoinedData) => void
  onUserLeft?: (data: UserLeftData) => void
  onUserTyping?: (data: UserTypingData) => void
  onMessageRead?: (data: MessageReadReceiptData) => void
  onMessageDeleted?: (data: MessageDeletedData) => void
  autoConnect?: boolean
}

export const useChatSocket = ({
  userName,
  roomName,
  baseUrl,
  onMessageReceived,
  onUserJoined,
  onUserLeft,
  onUserTyping,
  onMessageRead,
  onMessageDeleted,
  autoConnect = true
}: UseChatSocketProps) => {
  const { 
    messages,
    typingUsers,
    connectedUsers,
    addMessage,
    updateMessage,
    removeMessage,
    setTypingUser,
    addConnectedUser,
    removeConnectedUser,
    setCurrentRoom,
    setCurrentUser
  } = useChatStore()

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const ensureSocket = useCallback(() => {
    let socket = getChatSocket()

    if (!socket && userName && roomName) {
      socket = createChatSocket(userName, roomName, baseUrl)
    }

    if (socket?.disconnected) socket.connect()
    return socket
  }, [userName, roomName, baseUrl])

  useEffect(() => {
    if (!userName || !roomName || !autoConnect) return

    setCurrentUser(userName)
    setCurrentRoom(roomName)

    const socket = createChatSocket(userName, roomName, baseUrl)
    socket.connect()

    // Handle new messages
    const handleNewMessage = (data: ChatMessage) => {
      console.log('New message received:', data)
      addMessage(data)
      onMessageReceived?.(data)
    }

    // Handle user joined
    const handleUserJoined = (data: UserJoinedData) => {
      console.log('User joined:', data)
      addConnectedUser(data.userName)
      onUserJoined?.(data)
    }

    // Handle user left
    const handleUserLeft = (data: UserLeftData) => {
      console.log('User left:', data)
      removeConnectedUser(data.userName)
      onUserLeft?.(data)
    }

    // Handle user typing
    const handleUserTyping = (data: UserTypingData) => {
      console.log('User typing:', data)
      setTypingUser(data.userName, data.isTyping)
      onUserTyping?.(data)
    }

    // Handle message read receipt
    const handleMessageReadReceipt = (data: MessageReadReceiptData) => {
      console.log('Message read:', data)
      updateMessage(data.messageId, { isRead: true })
      onMessageRead?.(data)
    }

    // Handle message deleted
    const handleMessageDeleted = (data: MessageDeletedData) => {
      console.log('Message deleted:', data)
      removeMessage(data.messageId)
      onMessageDeleted?.(data)
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('userJoined', handleUserJoined)
    socket.on('userLeft', handleUserLeft)
    socket.on('userTyping', handleUserTyping)
    socket.on('messageReadReceipt', handleMessageReadReceipt)
    socket.on('messageDeleted', handleMessageDeleted)

    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('userJoined', handleUserJoined)
      socket.off('userLeft', handleUserLeft)
      socket.off('userTyping', handleUserTyping)
      socket.off('messageReadReceipt', handleMessageReadReceipt)
      socket.off('messageDeleted', handleMessageDeleted)
    }
  }, [
    userName, 
    roomName, 
    baseUrl, 
    autoConnect,
    onMessageReceived, 
    onUserJoined, 
    onUserLeft, 
    onUserTyping,
    onMessageRead,
    onMessageDeleted,
    addMessage,
    updateMessage,
    removeMessage,
    setTypingUser,
    addConnectedUser,
    removeConnectedUser,
    setCurrentRoom,
    setCurrentUser
  ])

  const sendMessage = useCallback((message: string, receiverName?: string, metadata?: any) => {
    if (!message.trim()) return

    const socket = ensureSocket()

    if (socket) {
      const messageData: Omit<ChatMessage, 'timestamp' | 'messageId'> = {
        senderName: userName,
        receiverName: receiverName,
        message: message.trim(),
        roomName: roomName,
        metadata: metadata
      }

      socket.emit('sendMessage', messageData)

      // Add to local state immediately for optimistic UI
      addMessage({
        ...messageData,
        messageId: `temp-${Date.now()}`,
        timestamp: new Date().toISOString()
      })
    }
  }, [userName, roomName, ensureSocket, addMessage])

  const joinRoom = useCallback((newRoomName: string) => {
    const socket = ensureSocket()

    if (socket) {
      socket.emit('joinRoom', { roomName: newRoomName })
      setCurrentRoom(newRoomName)
    }
  }, [ensureSocket, setCurrentRoom])

  const setTyping = useCallback((isTyping: boolean) => {
    const socket = ensureSocket()

    if (socket) {
      socket.emit('typing', { isTyping })

      // Auto-stop typing after 3 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing', { isTyping: false })
        }, 3000)
      }
    }
  }, [ensureSocket])

  const markMessageAsRead = useCallback((messageId: string, senderName: string) => {
    const socket = ensureSocket()

    if (socket) {
      socket.emit('messageRead', { messageId, senderName })
      updateMessage(messageId, { isRead: true })
    }
  }, [ensureSocket, updateMessage])

  const deleteMessage = useCallback((messageId: string) => {
    const socket = ensureSocket()

    if (socket) {
      socket.emit('deleteMessage', { messageId })
      removeMessage(messageId)
    }
  }, [ensureSocket, removeMessage])

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    connectedUsers: Array.from(connectedUsers),
    sendMessage,
    joinRoom,
    setTyping,
    markMessageAsRead,
    deleteMessage
  }
}
