import { useCallback, useEffect, useRef } from "react";
import { createVideoSocket, getVideoSocket } from "../socket";
import {
  CallAcceptedData,
  CallDeclinedData,
  CallEndedData,
  IncomingCallData
} from "../types/call.types";
import { useCallOverlay } from "./useCallOverlay";

interface UseVideoSocketProps {
  currentUser: string;
  baseUrl: string;
  ringingTimeoutMs?: number;
  onCallAccepted?: (data: CallAcceptedData) => void;
  onCallDeclined?: (data: CallDeclinedData) => void;
  onCallEnded?: (data: CallEndedData) => void;
}

const DEFAULT_RINGING_TIMEOUT_MS = 45000;

export const useVideoSocket = ({
  currentUser,
  baseUrl,
  ringingTimeoutMs = DEFAULT_RINGING_TIMEOUT_MS,
  onCallAccepted,
  onCallDeclined,
  onCallEnded
}: UseVideoSocketProps) => {
  const { incomingCall, isCallVisible, setIncomingCall, setIsCallVisible } =
    useCallOverlay();

  const callbacksRef = useRef({
    onCallAccepted,
    onCallDeclined,
    onCallEnded
  });
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbacksRef.current = {
      onCallAccepted,
      onCallDeclined,
      onCallEnded
    };
  }, [onCallAccepted, onCallDeclined, onCallEnded]);

  const clearRingingTimeout = useCallback(() => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
  }, []);

  const ensureSocket = useCallback(() => {
    let socket = getVideoSocket();

    if (!socket && currentUser) {
      socket = createVideoSocket(currentUser, baseUrl);
    }

    if (socket && !socket.connected) {
      socket.connect();
    }

    return socket;
  }, [currentUser, baseUrl]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const socket = createVideoSocket(currentUser, baseUrl);
    socket.connect();

    const handleIncomingCall = (data: IncomingCallData) => {
      setIncomingCall(data);
      setIsCallVisible(true);
    };

    const handleCallDeclined = (data: CallDeclinedData) => {
      clearRingingTimeout();
      socket.emit('joinCallRoom', { roomName: currentUser });
      setIsCallVisible(false);
      setIncomingCall(null);
      callbacksRef.current.onCallDeclined?.(data);
    };

    const handleCallAccepted = (data: CallAcceptedData) => {
      clearRingingTimeout();
      setIsCallVisible(false);
      setIncomingCall(null);
      callbacksRef.current.onCallAccepted?.(data);
    };

    const handleCallEnded = (data: CallEndedData) => {
      clearRingingTimeout();
      setIsCallVisible(false);
      setIncomingCall(null);
      callbacksRef.current.onCallEnded?.(data);
    };

    socket.on('incomingCall', handleIncomingCall);
    socket.on('callDeclined', handleCallDeclined);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('callEnded', handleCallEnded);

    return () => {
      clearRingingTimeout();
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callDeclined', handleCallDeclined);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callEnded', handleCallEnded);
    };
  }, [
    currentUser,
    baseUrl,
    setIncomingCall,
    setIsCallVisible,
    clearRingingTimeout
  ]);

  const acceptCall = useCallback(() => {
    const call = useCallOverlay.getState().incomingCall;
    if (!call) {
      return;
    }

    const socket = ensureSocket();
    if (socket) {
      socket.emit('acceptCall', {
        callerName: call.callerName,
        receiverName: call.receiverName,
        conversationId: call.conversationId
      });
    }

    clearRingingTimeout();
    setIsCallVisible(false);
    setIncomingCall(null);
  }, [ensureSocket, setIsCallVisible, setIncomingCall, clearRingingTimeout]);

  const declineCall = useCallback(
    (reason?: string) => {
      const call = useCallOverlay.getState().incomingCall;
      if (!call) {
        return;
      }

      const socket = ensureSocket();
      if (socket) {
        socket.emit('declineCall', {
          callerName: call.callerName,
          receiverName: call.receiverName,
          reason: reason || 'Call declined'
        });
        socket.emit('joinCallRoom', { roomName: currentUser });
      }

      clearRingingTimeout();
      setIsCallVisible(false);
      setIncomingCall(null);
    },
    [ensureSocket, setIsCallVisible, setIncomingCall, clearRingingTimeout, currentUser]
  );

  const cancelCall = useCallback(() => {
    const call = useCallOverlay.getState().incomingCall;
    if (!call) {
      return;
    }

    const socket = ensureSocket();
    if (socket) {
      socket.emit('cancelCall', {
        callerName: call.callerName,
        receiverName: call.receiverName,
        conversationId: call.conversationId
      });
      socket.emit('joinCallRoom', { roomName: call.callerName });
    }

    clearRingingTimeout();
    setIsCallVisible(false);
    setIncomingCall(null);
  }, [ensureSocket, setIsCallVisible, setIncomingCall, clearRingingTimeout]);

  const initiateCall = useCallback(
    (receiverName: string, conversationId: number) => {
      if (!currentUser) {
        return;
      }

      const socket = ensureSocket();
      if (!socket) {
        return;
      }

      socket.emit('joinCallRoom', { roomName: receiverName }, () => {
        setIsCallVisible(true);
        setIncomingCall({
          callerName: currentUser,
          receiverName,
          conversationId
        });

        socket.emit('incomingCall', {
          callerName: currentUser,
          receiverName,
          conversationId
        });

        clearRingingTimeout();
        ringingTimeoutRef.current = setTimeout(() => {
          const active = useCallOverlay.getState().incomingCall;
          if (
            active &&
            active.callerName === currentUser &&
            active.receiverName === receiverName
          ) {
            socket.emit('cancelCall', {
              callerName: currentUser,
              receiverName,
              conversationId
            });
            socket.emit('joinCallRoom', { roomName: currentUser });
            setIsCallVisible(false);
            setIncomingCall(null);
            callbacksRef.current.onCallEnded?.({
              callerName: currentUser,
              receiverName,
              conversationId,
              endedBy: currentUser,
              reason: 'Ringing timeout'
            });
          }
        }, ringingTimeoutMs);
      });
    },
    [
      currentUser,
      ensureSocket,
      setIsCallVisible,
      setIncomingCall,
      clearRingingTimeout,
      ringingTimeoutMs
    ]
  );

  return {
    incomingCall,
    isCallVisible,
    acceptCall,
    declineCall,
    cancelCall,
    initiateCall
  };
};
