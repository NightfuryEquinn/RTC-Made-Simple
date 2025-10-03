"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVideoSocket = void 0;
const react_1 = require("react");
const useCallOverlay_1 = require("./useCallOverlay");
const socket_1 = require("../socket");
const useVideoSocket = ({ currentUser, baseUrl, onCallAccepted, onCallDeclined, onCallEnded }) => {
    const { incomingCall, isCallVisible, setIncomingCall, setIsCallVisible } = (0, useCallOverlay_1.useCallOverlay)();
    (0, react_1.useEffect)(() => {
        if (!currentUser)
            return;
        const socket = (0, socket_1.createVideoSocket)(currentUser, baseUrl);
        socket.connect();
        const handleIncomingCall = (data) => {
            console.log('Incoming call received:', data);
            setIncomingCall(data);
            setIsCallVisible(true);
        };
        const handleCallDeclined = (data) => {
            const socket = ensureSocket();
            if (socket) {
                socket.emit('joinCallRoom', {
                    roomName: currentUser
                });
            }
            console.log('Call declined:', data);
            setIsCallVisible(false);
            setIncomingCall(null);
            onCallDeclined?.(data);
        };
        const handleCallAccepted = (data) => {
            console.log('Call accepted:', data);
            setIsCallVisible(false);
            setIncomingCall(null);
            onCallAccepted?.(data);
        };
        const handleCallEnded = (data) => {
            console.log('Call ended:', data);
            setIsCallVisible(false);
            setIncomingCall(null);
            onCallEnded?.(data);
        };
        socket.on('incomingCall', handleIncomingCall);
        socket.on('callDeclined', handleCallDeclined);
        socket.on('callAccepted', handleCallAccepted);
        socket.on('callEnded', handleCallEnded);
        return () => {
            socket.off('incomingCall', handleIncomingCall);
            socket.off('callDeclined', handleCallDeclined);
            socket.off('callAccepted', handleCallAccepted);
            socket.off('callEnded', handleCallEnded);
        };
    }, [currentUser, baseUrl, onCallAccepted, onCallDeclined, onCallEnded]);
    const ensureSocket = (0, react_1.useCallback)(() => {
        let socket = (0, socket_1.getVideoSocket)();
        if (!socket && currentUser) {
            socket = (0, socket_1.createVideoSocket)(currentUser, baseUrl);
        }
        if (socket?.disconnected)
            socket.connect();
        return socket;
    }, [currentUser, baseUrl]);
    const acceptCall = (0, react_1.useCallback)(() => {
        if (!incomingCall)
            return;
        const socket = ensureSocket();
        if (socket) {
            socket.emit('acceptCall', {
                callerName: incomingCall.callerName,
                receiverName: incomingCall.receiverName,
                conversationId: incomingCall.conversationId
            });
        }
        setIsCallVisible(false);
        setIncomingCall(null);
    }, [incomingCall]);
    const declineCall = (0, react_1.useCallback)((reason) => {
        if (!incomingCall)
            return;
        const socket = ensureSocket();
        if (socket) {
            socket.emit('declineCall', {
                callerName: incomingCall.callerName,
                receiverName: incomingCall.receiverName,
                reason: reason || 'Call declined'
            });
        }
        setIsCallVisible(false);
        setIncomingCall(null);
    }, [incomingCall, ensureSocket]);
    const cancelCall = (0, react_1.useCallback)(() => {
        if (!incomingCall)
            return;
        const socket = ensureSocket();
        if (socket) {
            socket.emit('cancelCall', {
                callerName: incomingCall.callerName,
                receiverName: incomingCall.receiverName,
                conversationId: incomingCall.conversationId
            });
            socket.emit('joinCallRoom', {
                roomName: incomingCall.callerName
            });
        }
        setIsCallVisible(false);
        setIncomingCall(null);
    }, [incomingCall, ensureSocket]);
    const initiateCall = (0, react_1.useCallback)((receiverName, conversationId) => {
        if (!currentUser)
            return;
        const socket = ensureSocket();
        if (socket) {
            socket.emit('joinCallRoom', {
                roomName: receiverName
            });
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
        }
    }, [currentUser, ensureSocket]);
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