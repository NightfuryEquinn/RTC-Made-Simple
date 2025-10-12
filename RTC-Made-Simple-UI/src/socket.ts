import { io, Socket } from "socket.io-client";

let videoSocket: Socket | null = null

export const createVideoSocket = (callerName: string, baseUrl: string) => {
  if (videoSocket?.connected) return videoSocket

  videoSocket = io(baseUrl, {
    transports: ['websocket'],
    path: '/call',
    query: {
      callerName: callerName,
      roomName: callerName,
    },
    autoConnect: false,
    forceNew: false
  })

  videoSocket.on('connect', () => {
    console.log(`Video socket connected for ${callerName} in own room`)
  })

  videoSocket.on('disconnect', () => {
    console.log(`Video socket disconnected`)
  })

  videoSocket.on('connect_error', (error) => {
    console.log(`Video socket connection error`)
  })

  return videoSocket
}

export const getVideoSocket = (): Socket | null => videoSocket

export const disconnectVideoSocket = () => {
  if (videoSocket?.connected) videoSocket.disconnect()
  videoSocket = null
}

// Chat Socket
let chatSocket: Socket | null = null

export const createChatSocket = (userName: string, roomName: string, baseUrl: string) => {
  if (chatSocket?.connected) return chatSocket

  chatSocket = io(baseUrl, {
    transports: ['websocket'],
    path: '/chat',
    query: {
      userName: userName,
      roomName: roomName,
    },
    autoConnect: false,
    forceNew: false
  })

  chatSocket.on('connect', () => {
    console.log(`Chat socket connected for ${userName} in room ${roomName}`)
  })

  chatSocket.on('disconnect', () => {
    console.log(`Chat socket disconnected`)
  })

  chatSocket.on('connect_error', (error) => {
    console.log(`Chat socket connection error`, error)
  })

  return chatSocket
}

export const getChatSocket = (): Socket | null => chatSocket

export const disconnectChatSocket = () => {
  if (chatSocket?.connected) chatSocket.disconnect()
  chatSocket = null
}