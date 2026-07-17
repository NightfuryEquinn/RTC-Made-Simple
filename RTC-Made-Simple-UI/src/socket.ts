import { io, Socket } from "socket.io-client";

let videoSocket: Socket | null = null;
let videoSocketKey: string | null = null;

let chatSocket: Socket | null = null;
let chatSocketKey: string | null = null;

const buildKey = (...parts: Array<string | undefined>) => parts.join('|');

export const createVideoSocket = (callerName: string, baseUrl: string): Socket => {
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
  videoSocket = io(baseUrl, {
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

export const getVideoSocket = (): Socket | null => videoSocket;

export const disconnectVideoSocket = () => {
  if (videoSocket) {
    videoSocket.removeAllListeners();
    videoSocket.disconnect();
  }
  videoSocket = null;
  videoSocketKey = null;
};

export const createChatSocket = (
  userName: string,
  roomName: string,
  baseUrl: string
): Socket => {
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
  chatSocket = io(baseUrl, {
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

export const getChatSocket = (): Socket | null => chatSocket;

export const disconnectChatSocket = () => {
  if (chatSocket) {
    chatSocket.removeAllListeners();
    chatSocket.disconnect();
  }
  chatSocket = null;
  chatSocketKey = null;
};
