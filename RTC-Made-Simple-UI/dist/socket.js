"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectChatSocket = exports.getChatSocket = exports.createChatSocket = exports.disconnectVideoSocket = exports.getVideoSocket = exports.createVideoSocket = void 0;
const socket_io_client_1 = require("socket.io-client");
let videoSocket = null;
let videoSocketKey = null;
let chatSocket = null;
let chatSocketKey = null;
const buildKey = (...parts) => parts.join('|');
const createVideoSocket = (callerName, baseUrl) => {
    const key = buildKey(baseUrl, callerName);
    if (videoSocket && videoSocketKey === key) {
        return videoSocket;
    }
    if (videoSocket) {
        videoSocket.removeAllListeners();
        videoSocket.disconnect();
        videoSocket = null;
    }
    videoSocketKey = key;
    videoSocket = (0, socket_io_client_1.io)(baseUrl, {
        transports: ['websocket'],
        path: '/call',
        query: {
            callerName,
            roomName: callerName
        },
        autoConnect: false,
        forceNew: true
    });
    videoSocket.on('connect', () => {
        console.log(`Video socket connected for ${callerName}`);
    });
    videoSocket.on('disconnect', (reason) => {
        console.log(`Video socket disconnected: ${reason}`);
    });
    videoSocket.on('connect_error', (error) => {
        console.log('Video socket connection error', error.message);
    });
    return videoSocket;
};
exports.createVideoSocket = createVideoSocket;
const getVideoSocket = () => videoSocket;
exports.getVideoSocket = getVideoSocket;
const disconnectVideoSocket = () => {
    if (videoSocket) {
        videoSocket.removeAllListeners();
        videoSocket.disconnect();
    }
    videoSocket = null;
    videoSocketKey = null;
};
exports.disconnectVideoSocket = disconnectVideoSocket;
const createChatSocket = (userName, roomName, baseUrl) => {
    const key = buildKey(baseUrl, userName, roomName);
    if (chatSocket && chatSocketKey === key) {
        return chatSocket;
    }
    if (chatSocket) {
        chatSocket.removeAllListeners();
        chatSocket.disconnect();
        chatSocket = null;
    }
    chatSocketKey = key;
    chatSocket = (0, socket_io_client_1.io)(baseUrl, {
        transports: ['websocket'],
        path: '/chat',
        query: {
            userName,
            roomName
        },
        autoConnect: false,
        forceNew: true
    });
    chatSocket.on('connect', () => {
        console.log(`Chat socket connected for ${userName} in room ${roomName}`);
    });
    chatSocket.on('disconnect', (reason) => {
        console.log(`Chat socket disconnected: ${reason}`);
    });
    chatSocket.on('connect_error', (error) => {
        console.log('Chat socket connection error', error.message);
    });
    return chatSocket;
};
exports.createChatSocket = createChatSocket;
const getChatSocket = () => chatSocket;
exports.getChatSocket = getChatSocket;
const disconnectChatSocket = () => {
    if (chatSocket) {
        chatSocket.removeAllListeners();
        chatSocket.disconnect();
    }
    chatSocket = null;
    chatSocketKey = null;
};
exports.disconnectChatSocket = disconnectChatSocket;
//# sourceMappingURL=socket.js.map