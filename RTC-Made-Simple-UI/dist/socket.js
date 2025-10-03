"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectVideoSocket = exports.getVideoSocket = exports.createVideoSocket = void 0;
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
//# sourceMappingURL=socket.js.map