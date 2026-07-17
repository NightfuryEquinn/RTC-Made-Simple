"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChatSocket = void 0;
const react_1 = require("react");
const socket_1 = require("../socket");
const useChatStore_1 = require("./useChatStore");
const useChatSocket = ({ userName, roomName, baseUrl, maxMessages, loadHistory = true, historyLimit = 50, onMessageReceived, onUserJoined, onUserLeft, onUserTyping, onMessageRead, onMessageDeleted, autoConnect = true }) => {
    const messages = (0, useChatStore_1.useChatStore)((state) => state.messages);
    const typingUsers = (0, useChatStore_1.useChatStore)((state) => state.typingUsers);
    const connectedUsers = (0, useChatStore_1.useChatStore)((state) => state.connectedUsers);
    const connectionError = (0, useChatStore_1.useChatStore)((state) => state.connectionError);
    const isConnected = (0, useChatStore_1.useChatStore)((state) => state.isConnected);
    const addMessage = (0, useChatStore_1.useChatStore)((state) => state.addMessage);
    const reconcileMessage = (0, useChatStore_1.useChatStore)((state) => state.reconcileMessage);
    const setMessages = (0, useChatStore_1.useChatStore)((state) => state.setMessages);
    const updateMessage = (0, useChatStore_1.useChatStore)((state) => state.updateMessage);
    const removeMessage = (0, useChatStore_1.useChatStore)((state) => state.removeMessage);
    const setTypingUser = (0, useChatStore_1.useChatStore)((state) => state.setTypingUser);
    const addConnectedUser = (0, useChatStore_1.useChatStore)((state) => state.addConnectedUser);
    const removeConnectedUser = (0, useChatStore_1.useChatStore)((state) => state.removeConnectedUser);
    const setCurrentRoom = (0, useChatStore_1.useChatStore)((state) => state.setCurrentRoom);
    const setCurrentUser = (0, useChatStore_1.useChatStore)((state) => state.setCurrentUser);
    const setMaxMessages = (0, useChatStore_1.useChatStore)((state) => state.setMaxMessages);
    const setConnectionError = (0, useChatStore_1.useChatStore)((state) => state.setConnectionError);
    const setIsConnected = (0, useChatStore_1.useChatStore)((state) => state.setIsConnected);
    const clearMessages = (0, useChatStore_1.useChatStore)((state) => state.clearMessages);
    const typingTimeoutRef = (0, react_1.useRef)(null);
    const previousRoomRef = (0, react_1.useRef)(null);
    const callbacksRef = (0, react_1.useRef)({
        onMessageReceived,
        onUserJoined,
        onUserLeft,
        onUserTyping,
        onMessageRead,
        onMessageDeleted
    });
    (0, react_1.useEffect)(() => {
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
    const ensureSocket = (0, react_1.useCallback)(() => {
        let socket = (0, socket_1.getChatSocket)();
        if (!socket && userName && roomName) {
            socket = (0, socket_1.createChatSocket)(userName, roomName, baseUrl);
        }
        if (socket && !socket.connected) {
            socket.connect();
        }
        return socket;
    }, [userName, roomName, baseUrl]);
    (0, react_1.useEffect)(() => {
        if (typeof maxMessages === 'number') {
            setMaxMessages(maxMessages);
        }
    }, [maxMessages, setMaxMessages]);
    (0, react_1.useEffect)(() => {
        if (!userName || !roomName || !autoConnect) {
            return;
        }
        setCurrentUser(userName);
        setCurrentRoom(roomName);
        if (previousRoomRef.current && previousRoomRef.current !== roomName) {
            clearMessages();
        }
        previousRoomRef.current = roomName;
        const socket = (0, socket_1.createChatSocket)(userName, roomName, baseUrl);
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
        const handleConnectError = (error) => {
            setIsConnected(false);
            setConnectionError(error.message || 'Connection failed');
        };
        const handleNewMessage = (data) => {
            addMessage(data);
            callbacksRef.current.onMessageReceived?.(data);
        };
        const handleMessageAck = (data) => {
            if (data.clientMessageId) {
                reconcileMessage(data.clientMessageId, data);
            }
            else {
                addMessage(data);
            }
        };
        const handleMessageHistory = (data) => {
            setMessages(data.messages || []);
        };
        const handleUserJoined = (data) => {
            addConnectedUser(data.userName);
            callbacksRef.current.onUserJoined?.(data);
        };
        const handleUserLeft = (data) => {
            removeConnectedUser(data.userName);
            callbacksRef.current.onUserLeft?.(data);
        };
        const handleUserTyping = (data) => {
            setTypingUser(data.userName, data.isTyping);
            callbacksRef.current.onUserTyping?.(data);
        };
        const handleMessageReadReceipt = (data) => {
            updateMessage(data.messageId, { isRead: true });
            callbacksRef.current.onMessageRead?.(data);
        };
        const handleMessageDeleted = (data) => {
            removeMessage(data.messageId);
            callbacksRef.current.onMessageDeleted?.(data);
        };
        const handleError = (data) => {
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
    const sendMessage = (0, react_1.useCallback)((message, receiverName, metadata) => {
        if (!message.trim()) {
            return;
        }
        const socket = ensureSocket();
        if (!socket) {
            return;
        }
        const clientMessageId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const optimisticMessage = {
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
    }, [userName, roomName, ensureSocket, addMessage]);
    const joinRoom = (0, react_1.useCallback)((newRoomName) => {
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
    }, [ensureSocket, setCurrentRoom, clearMessages, loadHistory, historyLimit]);
    const setTyping = (0, react_1.useCallback)((isTyping) => {
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
    }, [ensureSocket]);
    const markMessageAsRead = (0, react_1.useCallback)((messageId, senderName) => {
        const socket = ensureSocket();
        if (!socket) {
            return;
        }
        socket.emit('messageRead', { messageId, senderName });
        updateMessage(messageId, { isRead: true });
    }, [ensureSocket, updateMessage]);
    const deleteMessage = (0, react_1.useCallback)((messageId) => {
        const socket = ensureSocket();
        if (!socket) {
            return;
        }
        socket.emit('deleteMessage', { messageId });
        removeMessage(messageId);
    }, [ensureSocket, removeMessage]);
    const loadMessages = (0, react_1.useCallback)((limit = historyLimit) => {
        const socket = ensureSocket();
        if (!socket) {
            return;
        }
        socket.emit('getMessages', { roomName, limit });
    }, [ensureSocket, roomName, historyLimit]);
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
exports.useChatSocket = useChatSocket;
//# sourceMappingURL=useChatSocket.js.map