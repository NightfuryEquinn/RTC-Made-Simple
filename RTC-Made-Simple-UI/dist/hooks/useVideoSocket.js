"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVideoSocket = void 0;
const react_1 = require("react");
const socket_1 = require("../socket");
const useCallOverlay_1 = require("./useCallOverlay");
const DEFAULT_RINGING_TIMEOUT_MS = 45000;
const useVideoSocket = ({ currentUser, baseUrl, ringingTimeoutMs = DEFAULT_RINGING_TIMEOUT_MS, onCallAccepted, onCallDeclined, onCallEnded }) => {
    const { incomingCall, isCallVisible, setIncomingCall, setIsCallVisible } = (0, useCallOverlay_1.useCallOverlay)();
    const callbacksRef = (0, react_1.useRef)({
        onCallAccepted,
        onCallDeclined,
        onCallEnded
    });
    const ringingTimeoutRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        callbacksRef.current = {
            onCallAccepted,
            onCallDeclined,
            onCallEnded
        };
    }, [onCallAccepted, onCallDeclined, onCallEnded]);
    const clearRingingTimeout = (0, react_1.useCallback)(() => {
        if (ringingTimeoutRef.current) {
            clearTimeout(ringingTimeoutRef.current);
            ringingTimeoutRef.current = null;
        }
    }, []);
    const ensureSocket = (0, react_1.useCallback)(() => {
        let socket = (0, socket_1.getVideoSocket)();
        if (!socket && currentUser) {
            socket = (0, socket_1.createVideoSocket)(currentUser, baseUrl);
        }
        if (socket && !socket.connected) {
            socket.connect();
        }
        return socket;
    }, [currentUser, baseUrl]);
    (0, react_1.useEffect)(() => {
        if (!currentUser) {
            return;
        }
        const socket = (0, socket_1.createVideoSocket)(currentUser, baseUrl);
        socket.connect();
        const handleIncomingCall = (data) => {
            setIncomingCall(data);
            setIsCallVisible(true);
        };
        const handleCallDeclined = (data) => {
            clearRingingTimeout();
            socket.emit('joinCallRoom', { roomName: currentUser });
            setIsCallVisible(false);
            setIncomingCall(null);
            callbacksRef.current.onCallDeclined?.(data);
        };
        const handleCallAccepted = (data) => {
            clearRingingTimeout();
            setIsCallVisible(false);
            setIncomingCall(null);
            callbacksRef.current.onCallAccepted?.(data);
        };
        const handleCallEnded = (data) => {
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
    const acceptCall = (0, react_1.useCallback)(() => {
        const call = useCallOverlay_1.useCallOverlay.getState().incomingCall;
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
    const declineCall = (0, react_1.useCallback)((reason) => {
        const call = useCallOverlay_1.useCallOverlay.getState().incomingCall;
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
    }, [ensureSocket, setIsCallVisible, setIncomingCall, clearRingingTimeout, currentUser]);
    const cancelCall = (0, react_1.useCallback)(() => {
        const call = useCallOverlay_1.useCallOverlay.getState().incomingCall;
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
    const initiateCall = (0, react_1.useCallback)((receiverName, conversationId) => {
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
                const active = useCallOverlay_1.useCallOverlay.getState().incomingCall;
                if (active &&
                    active.callerName === currentUser &&
                    active.receiverName === receiverName) {
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
    }, [
        currentUser,
        ensureSocket,
        setIsCallVisible,
        setIncomingCall,
        clearRingingTimeout,
        ringingTimeoutMs
    ]);
    return {
        incomingCall,
        isCallVisible,
        acceptCall,
        declineCall,
        cancelCall,
        initiateCall
    };
};
exports.useVideoSocket = useVideoSocket;
//# sourceMappingURL=useVideoSocket.js.map