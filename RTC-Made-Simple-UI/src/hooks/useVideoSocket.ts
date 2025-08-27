import { useCallback, useEffect } from "react"
import { CallAcceptedData, CallDeclinedData, CallEndedData, IncomingCallData } from "../types/call.types"
import { useCallOverlay } from "./useCallOverlay"
import { createVideoSocket, getVideoSocket } from "../socket"

interface UseVideoSocketProps {
  currentUser: string
  baseUrl: string
  onCallAccepted?: (data: CallAcceptedData) => void
  onCallDeclined?: (data: CallDeclinedData) => void
  onCallEnded?: (data: CallEndedData) => void
}

export const useVideoSocket = ({
  currentUser,
  baseUrl,
  onCallAccepted,
  onCallDeclined,
  onCallEnded
}: UseVideoSocketProps) => {
  const { incomingCall, isCallVisible, setIncomingCall, setIsCallVisible } = useCallOverlay()

  useEffect(() => {
    if (!currentUser) return

    const socket = createVideoSocket(currentUser, baseUrl)
    socket.connect()

    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('Incoming call received:', data)
      setIncomingCall(data)
      setIsCallVisible(true)
    }

    const handleCallDeclined = (data: CallDeclinedData) => {
      const socket = ensureSocket()

      if (socket) {
        socket.emit('joinCallRoom', {
          roomName: currentUser
        })
      }

      console.log('Call declined:', data)
      setIsCallVisible(false)
      setIncomingCall(null)
      onCallDeclined?.(data)
    }

    const handleCallAccepted = (data: CallAcceptedData) => {
      console.log('Call accepted:', data)
      setIsCallVisible(false)
      setIncomingCall(null)
      onCallAccepted?.(data)
    }

    const handleCallEnded = (data: CallEndedData) => {
      console.log('Call ended:', data)
      setIsCallVisible(false)
      setIncomingCall(null)
      onCallEnded?.(data)
    }

    socket.on('incomingCall', handleIncomingCall)
    socket.on('callDeclined', handleCallDeclined)
    socket.on('callAccepted', handleCallAccepted)
    socket.on('callEnded', handleCallEnded)

    return () => {
      socket.off('incomingCall', handleIncomingCall)
      socket.off('callDeclined', handleCallDeclined)
      socket.off('callAccepted', handleCallAccepted)
      socket.off('callEnded', handleCallEnded)
    }
  }, [currentUser, baseUrl, onCallAccepted, onCallDeclined, onCallEnded])

  const ensureSocket = useCallback(() => {
    let socket = getVideoSocket()

    if (!socket && currentUser) {
      socket = createVideoSocket(currentUser, baseUrl)
    }

    if (socket?.disconnected) socket.connect()
    return socket
  }, [currentUser, baseUrl])

  const acceptCall = useCallback(() => {
    if (!incomingCall) return

    const socket = ensureSocket()

    if (socket) {
      socket.emit('acceptCall', {
        callerName: incomingCall.callerName,
        receiverName: incomingCall.receiverName,
        conversationId: incomingCall.conversationId
      })
    }

    setIsCallVisible(false)
    setIncomingCall(null)
  }, [incomingCall])

  const declineCall = useCallback((reason?: string) => {
    if (!incomingCall) return

    const socket = ensureSocket()

    if (socket) {
      socket.emit('declineCall', {
        callerName: incomingCall.callerName,
        receiverName: incomingCall.receiverName,
        reason: reason || 'Call declined'
      })
    }

    setIsCallVisible(false)
    setIncomingCall(null)
  }, [incomingCall, ensureSocket])

  const cancelCall = useCallback(() => {
    if (!incomingCall) return

    const socket = ensureSocket()

    if (socket) {
      socket.emit('cancelCall', {
        callerName: incomingCall.callerName,
        receiverName: incomingCall.receiverName,
        conversationId: incomingCall.conversationId
      })

      socket.emit('joinCallRoom', {
        roomName: incomingCall.callerName
      })
    }

    setIsCallVisible(false)
    setIncomingCall(null)
  }, [incomingCall, ensureSocket])

  const initiateCall = useCallback((receiverName: string, conversationId: number) => {
    if (!currentUser) return
    
    const socket = ensureSocket()

    if (socket) {
      socket.emit('joinCallRoom', {
        roomName: receiverName
      })

      setIsCallVisible(true)
      setIncomingCall({
        callerName: currentUser,
        receiverName,
        conversationId
      })

      socket.emit('incomingCall', {
        callerName: currentUser,
        receiverName,
        conversationId
      })
    }
  }, [currentUser, ensureSocket])

  return {
    incomingCall,
    isCallVisible,
    acceptCall,
    declineCall,
    cancelCall,
    initiateCall
  }
}