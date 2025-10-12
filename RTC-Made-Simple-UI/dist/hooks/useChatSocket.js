"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChatSocket = void 0;
const react_1 = require("react");
const socket_1 = require("../socket");
const useChatStore_1 = require("./useChatStore");
const useChatSocket = ({ userName, roomName, baseUrl, onMessageReceived, onUserJoined, onUserLeft, onUserTyping, onMessageRead, onMessageDeleted, autoConnect = true }) => {
    const { messages, typingUsers, connectedUsers, addMessage, updateMessage, removeMessage, setTypingUser, addConnectedUser, removeConnectedUser, setCurrentRoom, setCurrentUser } = (0, useChatStore_1.useChatStore)();
    const typingTimeoutRef = (0, react_1.useRef)(null);
    const ensureSocket = (0, react_1.useCallback)(() => {
        let socket = (0, socket_1.getChatSocket)();
        if (!socket && userName && roomName) {
            socket = (0, socket_1.createChatSocket)(userName, roomName, baseUrl);
        }
        if (socket?.disconnected)
            socket.connect();
        return socket;
    }, [userName, roomName, baseUrl]);
    (0, react_1.useEffect)(() => {
        if (!userName || !roomName || !autoConnect)
            return;
        setCurrentUser(userName);
        setCurrentRoom(roomName);
        const socket = (0, socket_1.createChatSocket)(userName, roomName, baseUrl);
        socket.connect();
        // Handle new messages
        const handleNewMessage = (data) => {
            console.log('New message received:', data);
            addMessage(data);
            onMessageReceived?.(data);
        };
        // Handle user joined
        const handleUserJoined = (data) => {
            console.log('User joined:', data);
            addConnectedUser(data.userName);
            onUserJoined?.(data);
        };
        // Handle user left
        const handleUserLeft = (data) => {
            console.log('User left:', data);
            removeConnectedUser(data.userName);
            onUserLeft?.(data);
        };
        // Handle user typing
        const handleUserTyping = (data) => {
            console.log('User typing:', data);
            setTypingUser(data.userName, data.isTyping);
            onUserTyping?.(data);
        };
        // Handle message read receipt
        const handleMessageReadReceipt = (data) => {
            console.log('Message read:', data);
            updateMessage(data.messageId, { isRead: true });
            onMessageRead?.(data);
        };
        // Handle message deleted
        const handleMessageDeleted = (data) => {
            console.log('Message deleted:', data);
            removeMessage(data.messageId);
            onMessageDeleted?.(data);
        };
        socket.on('newMessage', handleNewMessage);
        socket.on('userJoined', handleUserJoined);
        socket.on('userLeft', handleUserLeft);
        socket.on('userTyping', handleUserTyping);
        socket.on('messageReadReceipt', handleMessageReadReceipt);
        socket.on('messageDeleted', handleMessageDeleted);
        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('userJoined', handleUserJoined);
            socket.off('userLeft', handleUserLeft);
            socket.off('userTyping', handleUserTyping);
            socket.off('messageReadReceipt', handleMessageReadReceipt);
            socket.off('messageDeleted', handleMessageDeleted);
        };
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
    ]);
    const sendMessage = (0, react_1.useCallback)((message, receiverName, metadata) => {
        if (!message.trim())
            return;
        const socket = ensureSocket();
        if (socket) {
            const messageData = {
                senderName: userName,
                receiverName: receiverName,
                message: message.trim(),
                roomName: roomName,
                metadata: metadata
            };
            socket.emit('sendMessage', messageData);
            // Add to local state immediately for optimistic UI
            addMessage({
                ...messageData,
                messageId: `temp-${Date.now()}`,
                timestamp: new Date().toISOString()
            });
        }
    }, [userName, roomName, ensureSocket, addMessage]);
    const joinRoom = (0, react_1.useCallback)((newRoomName) => {
        const socket = ensureSocket();
        if (socket) {
            socket.emit('joinRoom', { roomName: newRoomName });
            setCurrentRoom(newRoomName);
        }
    }, [ensureSocket, setCurrentRoom]);
    const setTyping = (0, react_1.useCallback)((isTyping) => {
        const socket = ensureSocket();
        if (socket) {
            socket.emit('typing', { isTyping });
            // Auto-stop typing after 3 seconds
            if (isTyping) {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    socket.emit('typing', { isTyping: false });
                }, 3000);
            }
        }
    }, [ensureSocket]);
    const markMessageAsRead = (0, react_1.useCallback)((messageId, senderName) => {
        const socket = ensureSocket();
        if (socket) {
            socket.emit('messageRead', { messageId, senderName });
            updateMessage(messageId, { isRead: true });
        }
    }, [ensureSocket, updateMessage]);
    const deleteMessage = (0, react_1.useCallback)((messageId) => {
        const socket = ensureSocket();
        if (socket) {
            socket.emit('deleteMessage', { messageId });
            removeMessage(messageId);
        }
    }, [ensureSocket, removeMessage]);
    return {
        messages,
        typingUsers: Array.from(typingUsers),
        connectedUsers: Array.from(connectedUsers),
        sendMessage,
        joinRoom,
        setTyping,
        markMessageAsRead,
        deleteMessage
    };
};
exports.useChatSocket = useChatSocket;
//# sourceMappingURL=useChatSocket.js.map