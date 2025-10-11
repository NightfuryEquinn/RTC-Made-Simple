"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVideoSocket = void 0;
const react_1 = require("react");
const socket_1 = require("../socket");
const useCallOverlay_1 = require("./useCallOverlay");
const useVideoSocket = ({ currentUser, baseUrl, onCallAccepted, onCallDeclined, onCallEnded }) => {
    const { incomingCall, isCallVisible, setIncomingCall, setIsCallVisible } = (0, useCallOverlay_1.useCallOverlay)();
    const ensureSocket = (0, react_1.useCallback)(() => {
        let socket = (0, socket_1.getVideoSocket)();
        if (!socket && currentUser) {
            socket = (0, socket_1.createVideoSocket)(currentUser, baseUrl);
        }
        if (socket?.disconnected)
            socket.connect();
        return socket;
    }, [currentUser, baseUrl]);
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
            const socket = (0, socket_1.getVideoSocket)();
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
    }, [currentUser, baseUrl, onCallAccepted, onCallDeclined, onCallEnded, setIncomingCall, setIsCallVisible]);
    const acceptCall = (0, react_1.useCallback)(() => {
        const call = useCallOverlay_1.useCallOverlay.getState().incomingCall;
        if (!call)
            return;
        const socket = ensureSocket();
        if (socket) {
            socket.emit('acceptCall', {
                callerName: call.callerName,
                receiverName: call.receiverName,
                conversationId: call.conversationId
            });
        }
        setIsCallVisible(false);
        setIncomingCall(null);
    }, [ensureSocket, setIsCallVisible, setIncomingCall]);
    const declineCall = (0, react_1.useCallback)((reason) => {
        const call = useCallOverlay_1.useCallOverlay.getState().incomingCall;
        if (!call)
            return;
        const socket = ensureSocket();
        if (socket) {
            socket.emit('declineCall', {
                callerName: call.callerName,
                receiverName: call.receiverName,
                reason: reason || 'Call declined'
            });
        }
        setIsCallVisible(false);
        setIncomingCall(null);
    }, [ensureSocket, setIsCallVisible, setIncomingCall]);
    const cancelCall = (0, react_1.useCallback)(() => {
        const call = useCallOverlay_1.useCallOverlay.getState().incomingCall;
        if (!call)
            return;
        const socket = ensureSocket();
        if (socket) {
            socket.emit('cancelCall', {
                callerName: call.callerName,
                receiverName: call.receiverName,
                conversationId: call.conversationId
            });
            socket.emit('joinCallRoom', {
                roomName: call.callerName
            });
        }
        setIsCallVisible(false);
        setIncomingCall(null);
    }, [ensureSocket, setIsCallVisible, setIncomingCall]);
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
    }, [currentUser, ensureSocket, setIsCallVisible, setIncomingCall]);
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