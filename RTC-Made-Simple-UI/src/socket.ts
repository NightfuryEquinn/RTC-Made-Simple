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