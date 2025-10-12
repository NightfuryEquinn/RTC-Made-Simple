"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectChatSocket = exports.getChatSocket = exports.createChatSocket = exports.disconnectVideoSocket = exports.getVideoSocket = exports.createVideoSocket = void 0;
const socket_io_client_1 = require("socket.io-client");
let videoSocket = null;
const createVideoSocket = (callerName, baseUrl) => {
    if (videoSocket?.connected)
        return videoSocket;
    videoSocket = (0, socket_io_client_1.io)(baseUrl, {
        transports: ['websocket'],
        path: '/call',
        query: {
            callerName: callerName,
            roomName: callerName,
        },
        autoConnect: false,
        forceNew: false
    });
    videoSocket.on('connect', () => {
        console.log(`Video socket connected for ${callerName} in own room`);
    });
    videoSocket.on('disconnect', () => {
        console.log(`Video socket disconnected`);
    });
    videoSocket.on('connect_error', (error) => {
        console.log(`Video socket connection error`);
    });
    return videoSocket;
};
exports.createVideoSocket = createVideoSocket;
const getVideoSocket = () => videoSocket;
exports.getVideoSocket = getVideoSocket;
const disconnectVideoSocket = () => {
    if (videoSocket?.connected)
        videoSocket.disconnect();
    videoSocket = null;
};
exports.disconnectVideoSocket = disconnectVideoSocket;
// Chat Socket
let chatSocket = null;
const createChatSocket = (userName, roomName, baseUrl) => {
    if (chatSocket?.connected)
        return chatSocket;
    chatSocket = (0, socket_io_client_1.io)(baseUrl, {
        transports: ['websocket'],
        path: '/chat',
        query: {
            userName: userName,
            roomName: roomName,
        },
        autoConnect: false,
        forceNew: false
    });
    chatSocket.on('connect', () => {
        console.log(`Chat socket connected for ${userName} in room ${roomName}`);
    });
    chatSocket.on('disconnect', () => {
        console.log(`Chat socket disconnected`);
    });
    chatSocket.on('connect_error', (error) => {
        console.log(`Chat socket connection error`, error);
    });
    return chatSocket;
};
exports.createChatSocket = createChatSocket;
const getChatSocket = () => chatSocket;
exports.getChatSocket = getChatSocket;
const disconnectChatSocket = () => {
    if (chatSocket?.connected)
        chatSocket.disconnect();
    chatSocket = null;
};
exports.disconnectChatSocket = disconnectChatSocket;
//# sourceMappingURL=socket.js.map