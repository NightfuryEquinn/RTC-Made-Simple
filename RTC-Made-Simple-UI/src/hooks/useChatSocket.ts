import { useCallback, useEffect, useRef } from "react";
import { createChatSocket, getChatSocket } from "../socket";
import {
  ChatMessage,
  MessageDeletedData,
  MessageHistoryData,
  MessageReadReceiptData,
  UserJoinedData,
  UserLeftData,
  UserTypingData
} from "../types/chat.types";
import { useChatStore } from "./useChatStore";

interface UseChatSocketProps {
  userName: string;
  roomName: string;
  baseUrl: string;
  maxMessages?: number;
  loadHistory?: boolean;
  historyLimit?: number;
  onMessageReceived?: (message: ChatMessage) => void;
  onUserJoined?: (data: UserJoinedData) => void;
  onUserLeft?: (data: UserLeftData) => void;
  onUserTyping?: (data: UserTypingData) => void;
  onMessageRead?: (data: MessageReadReceiptData) => void;
  onMessageDeleted?: (data: MessageDeletedData) => void;
  autoConnect?: boolean;
}

export const useChatSocket = ({
  userName,
  roomName,
  baseUrl,
  maxMessages,
  loadHistory = true,
  historyLimit = 50,
  onMessageReceived,
  onUserJoined,
  onUserLeft,
  onUserTyping,
  onMessageRead,
  onMessageDeleted,
  autoConnect = true
}: UseChatSocketProps) => {
  const messages = useChatStore((state) => state.messages);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const connectedUsers = useChatStore((state) => state.connectedUsers);
  const connectionError = useChatStore((state) => state.connectionError);
  const isConnected = useChatStore((state) => state.isConnected);

  const addMessage = useChatStore((state) => state.addMessage);
  const reconcileMessage = useChatStore((state) => state.reconcileMessage);
  const setMessages = useChatStore((state) => state.setMessages);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const addConnectedUser = useChatStore((state) => state.addConnectedUser);
  const removeConnectedUser = useChatStore((state) => state.removeConnectedUser);
  const setCurrentRoom = useChatStore((state) => state.setCurrentRoom);
  const setCurrentUser = useChatStore((state) => state.setCurrentUser);
  const setMaxMessages = useChatStore((state) => state.setMaxMessages);
  const setConnectionError = useChatStore((state) => state.setConnectionError);
  const setIsConnected = useChatStore((state) => state.setIsConnected);
  const clearMessages = useChatStore((state) => state.clearMessages);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRoomRef = useRef<string | null>(null);

  const callbacksRef = useRef({
    onMessageReceived,
    onUserJoined,
    onUserLeft,
    onUserTyping,
    onMessageRead,
    onMessageDeleted
  });

  useEffect(() => {
    callbacksRef.current = {
      onMessageReceived,
      onUserJoined,
      onUserLeft,
      onUserTyping,
      onMessageRead,
      onMessageDeleted
    };
  }, [
    onMessageReceived,
    onUserJoined,
    onUserLeft,
    onUserTyping,
    onMessageRead,
    onMessageDeleted
  ]);

  const ensureSocket = useCallback(() => {
    let socket = getChatSocket();

    if (!socket && userName && roomName) {
      socket = createChatSocket(userName, roomName, baseUrl);
    }

    if (socket && !socket.connected) {
      socket.connect();
    }

    return socket;
  }, [userName, roomName, baseUrl]);

  useEffect(() => {
    if (typeof maxMessages === 'number') {
      setMaxMessages(maxMessages);
    }
  }, [maxMessages, setMaxMessages]);

  useEffect(() => {
    if (!userName || !roomName || !autoConnect) {
      return;
    }

    setCurrentUser(userName);
    setCurrentRoom(roomName);

    if (previousRoomRef.current && previousRoomRef.current !== roomName) {
      clearMessages();
    }
    previousRoomRef.current = roomName;

    const socket = createChatSocket(userName, roomName, baseUrl);
    socket.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      socket.emit('joinRoom', { roomName }, () => {
        if (loadHistory) {
          socket.emit('getMessages', { roomName, limit: historyLimit });
        }
      });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      setIsConnected(false);
      setConnectionError(error.message || 'Connection failed');
    };

    const handleNewMessage = (data: ChatMessage) => {
      addMessage(data);
      callbacksRef.current.onMessageReceived?.(data);
    };

    const handleMessageAck = (data: ChatMessage & { clientMessageId?: string }) => {
      if (data.clientMessageId) {
        reconcileMessage(data.clientMessageId, data);
      } else {
        addMessage(data);
      }
    };

    const handleMessageHistory = (data: MessageHistoryData) => {
      setMessages(data.messages || []);
    };

    const handleUserJoined = (data: UserJoinedData) => {
      addConnectedUser(data.userName);
      callbacksRef.current.onUserJoined?.(data);
    };

    const handleUserLeft = (data: UserLeftData) => {
      removeConnectedUser(data.userName);
      callbacksRef.current.onUserLeft?.(data);
    };

    const handleUserTyping = (data: UserTypingData) => {
      setTypingUser(data.userName, data.isTyping);
      callbacksRef.current.onUserTyping?.(data);
    };

    const handleMessageReadReceipt = (data: MessageReadReceiptData) => {
      updateMessage(data.messageId, { isRead: true });
      callbacksRef.current.onMessageRead?.(data);
    };

    const handleMessageDeleted = (data: MessageDeletedData) => {
      removeMessage(data.messageId);
      callbacksRef.current.onMessageDeleted?.(data);
    };

    const handleError = (data: { message?: string }) => {
      setConnectionError(data?.message || 'Chat error');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('newMessage', handleNewMessage);
    socket.on('messageAck', handleMessageAck);
    socket.on('messageHistory', handleMessageHistory);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('userTyping', handleUserTyping);
    socket.on('messageReadReceipt', handleMessageReadReceipt);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('error', handleError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('newMessage', handleNewMessage);
      socket.off('messageAck', handleMessageAck);
      socket.off('messageHistory', handleMessageHistory);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('userTyping', handleUserTyping);
      socket.off('messageReadReceipt', handleMessageReadReceipt);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('error', handleError);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [
    userName,
    roomName,
    baseUrl,
    autoConnect,
    loadHistory,
    historyLimit,
    addMessage,
    reconcileMessage,
    setMessages,
    updateMessage,
    removeMessage,
    setTypingUser,
    addConnectedUser,
    removeConnectedUser,
    setCurrentRoom,
    setCurrentUser,
    setConnectionError,
    setIsConnected,
    clearMessages
  ]);

  const sendMessage = useCallback(
    (message: string, receiverName?: string, metadata?: any) => {
      if (!message.trim()) {
        return;
      }

      const socket = ensureSocket();
      if (!socket) {
        return;
      }

      const clientMessageId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimisticMessage: ChatMessage = {
        messageId: clientMessageId,
        clientMessageId,
        senderName: userName,
        receiverName,
        message: message.trim(),
        roomName,
        metadata,
        timestamp: new Date().toISOString()
      };

      addMessage(optimisticMessage);
      socket.emit('sendMessage', {
        message: optimisticMessage.message,
        receiverName,
        metadata,
        clientMessageId
      });
    },
    [userName, roomName, ensureSocket, addMessage]
  );

  const joinRoom = useCallback(
    (newRoomName: string) => {
      const socket = ensureSocket();
      if (!socket) {
        return;
      }

      clearMessages();
      socket.emit('joinRoom', { roomName: newRoomName }, () => {
        setCurrentRoom(newRoomName);
        if (loadHistory) {
          socket.emit('getMessages', { roomName: newRoomName, limit: historyLimit });
        }
      });
    },
    [ensureSocket, setCurrentRoom, clearMessages, loadHistory, historyLimit]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      const socket = ensureSocket();
      if (!socket) {
        return;
      }

      socket.emit('typing', { isTyping });

      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing', { isTyping: false });
        }, 3000);
      }
    },
    [ensureSocket]
  );

  const markMessageAsRead = useCallback(
    (messageId: string, senderName: string) => {
      const socket = ensureSocket();
      if (!socket) {
        return;
      }

      socket.emit('messageRead', { messageId, senderName });
      updateMessage(messageId, { isRead: true });
    },
    [ensureSocket, updateMessage]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      const socket = ensureSocket();
      if (!socket) {
        return;
      }

      socket.emit('deleteMessage', { messageId });
      removeMessage(messageId);
    },
    [ensureSocket, removeMessage]
  );

  const loadMessages = useCallback(
    (limit = historyLimit) => {
      const socket = ensureSocket();
      if (!socket) {
        return;
      }
      socket.emit('getMessages', { roomName, limit });
    },
    [ensureSocket, roomName, historyLimit]
  );

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    connectedUsers: Array.from(connectedUsers),
    isConnected,
    connectionError,
    sendMessage,
    joinRoom,
    setTyping,
    markMessageAsRead,
    deleteMessage,
    loadMessages
  };
};
