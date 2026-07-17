"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCallScreen = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_incall_manager_1 = __importDefault(require("react-native-incall-manager"));
const react_native_webrtc_1 = require("react-native-webrtc");
const formatTime_1 = require("../helpers/formatTime");
const socket_1 = require("../socket");
const DEFAULT_ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
];
const DEFAULT_MEDIA_CONSTRAINTS = {
    audio: true,
    video: {
        width: 640,
        height: 480,
        frameRate: 30,
        facingMode: 'user'
    }
};
const VideoCallScreen = ({ currentUser, conversationId, receiverName, callerName, onCallEnd, iceServers = DEFAULT_ICE_SERVERS, mediaConstraints = DEFAULT_MEDIA_CONSTRAINTS, avatarUrl, localAvatarUrl, offerTimeoutMs = 15000 }) => {
    const [elapsed, setElapsed] = (0, react_1.useState)(0);
    const [isCameraOn, setIsCameraOn] = (0, react_1.useState)(true);
    const [isFrontCamera, setIsFrontCamera] = (0, react_1.useState)(true);
    const [isMicOn, setIsMicOn] = (0, react_1.useState)(true);
    const [localStream, setLocalStream] = (0, react_1.useState)(null);
    const [remoteStream, setRemoteStream] = (0, react_1.useState)(null);
    const [connectionState, setConnectionState] = (0, react_1.useState)('connecting');
    const peerConnection = (0, react_1.useRef)(null);
    const localStreamRef = (0, react_1.useRef)(null);
    const elapsedRef = (0, react_1.useRef)(0);
    const endedRef = (0, react_1.useRef)(false);
    const isInitialized = (0, react_1.useRef)(false);
    const pendingIceCandidates = (0, react_1.useRef)([]);
    const socketHandlersSet = (0, react_1.useRef)(false);
    const offerSentRef = (0, react_1.useRef)(false);
    const intervalRef = (0, react_1.useRef)(null);
    const offerTimeoutRef = (0, react_1.useRef)(null);
    const onCallEndRef = (0, react_1.useRef)(onCallEnd);
    const socket = (0, socket_1.getVideoSocket)();
    const isCaller = currentUser === callerName;
    (0, react_1.useEffect)(() => {
        onCallEndRef.current = onCallEnd;
    }, [onCallEnd]);
    const cleanup = (0, react_1.useCallback)(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (offerTimeoutRef.current) {
            clearTimeout(offerTimeoutRef.current);
            offerTimeoutRef.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        pendingIceCandidates.current = [];
        socketHandlersSet.current = false;
        isInitialized.current = false;
        offerSentRef.current = false;
        try {
            react_native_incall_manager_1.default.stop();
        }
        catch {
            // no-op when InCallManager is unavailable in tests/web
        }
    }, []);
    const finishCall = (0, react_1.useCallback)((shouldEmitEnd) => {
        if (endedRef.current) {
            return;
        }
        endedRef.current = true;
        if (shouldEmitEnd && socket) {
            socket.emit('endCall', {
                callerName,
                receiverName,
                conversationId
            });
        }
        if (socket) {
            socket.emit('joinCallRoom', { roomName: currentUser });
        }
        const duration = (0, formatTime_1.formatTime)(elapsedRef.current);
        cleanup();
        onCallEndRef.current(duration);
    }, [socket, callerName, receiverName, conversationId, currentUser, cleanup]);
    const processingPendingIceCandidates = (0, react_1.useCallback)(async () => {
        if (!peerConnection.current?.remoteDescription) {
            return;
        }
        const candidates = [...pendingIceCandidates.current];
        pendingIceCandidates.current = [];
        for (const candidate of candidates) {
            try {
                await peerConnection.current?.addIceCandidate(candidate);
            }
            catch (error) {
                console.error('Error adding pending ICE candidate', error);
            }
        }
    }, []);
    const createOffer = (0, react_1.useCallback)(async () => {
        if (!peerConnection.current || offerSentRef.current || !socket) {
            return;
        }
        offerSentRef.current = true;
        if (offerTimeoutRef.current) {
            clearTimeout(offerTimeoutRef.current);
            offerTimeoutRef.current = null;
        }
        const offer = await peerConnection.current.createOffer({});
        await peerConnection.current.setLocalDescription(offer);
        socket.emit('newCall', {
            receiverName,
            rtcMessage: offer
        });
    }, [socket, receiverName]);
    const createPeerConnection = (0, react_1.useCallback)(() => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        const pc = new react_native_webrtc_1.RTCPeerConnection({
            iceServers
        });
        // @ts-ignore - react-native-webrtc event typings
        pc.addEventListener('track', (event) => {
            const [stream] = event.streams;
            if (stream) {
                setRemoteStream(stream);
                setConnectionState('connected');
            }
        });
        // @ts-ignore
        pc.addEventListener('icecandidate', (event) => {
            if (event.candidate && socket) {
                socket.emit('ICEcandidate', {
                    callerName,
                    receiverName,
                    rtcMessage: {
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    }
                });
            }
        });
        // @ts-ignore
        pc.addEventListener('connectionstatechange', () => {
            setConnectionState(pc.connectionState);
        });
        return pc;
    }, [iceServers, socket, callerName, receiverName]);
    const initMedia = (0, react_1.useCallback)(async () => {
        react_native_incall_manager_1.default.start();
        react_native_incall_manager_1.default.setKeepScreenOn(true);
        react_native_incall_manager_1.default.setForceSpeakerphoneOn(true);
        const stream = await react_native_webrtc_1.mediaDevices.getUserMedia(mediaConstraints);
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
    }, [mediaConstraints]);
    const setupSocketHandlers = (0, react_1.useCallback)(() => {
        if (!socket || socketHandlersSet.current) {
            return;
        }
        socketHandlersSet.current = true;
        socket.off('newCall');
        socket.off('callAnswered');
        socket.off('ICEcandidate');
        socket.off('callEnded');
        socket.off('peerReady');
        socket.off('peerJoined');
        socket.on('peerReady', async (data) => {
            if (isCaller && data.userName === receiverName) {
                try {
                    await createOffer();
                }
                catch (error) {
                    console.error('Error creating offer after peerReady', error);
                    setConnectionState('failed');
                }
            }
        });
        socket.on('peerJoined', async (data) => {
            if (isCaller && data.userName === receiverName && !offerSentRef.current) {
                // Receiver joined the room; wait for peerReady for media readiness.
            }
        });
        socket.on('newCall', async (data) => {
            try {
                if (!peerConnection.current) {
                    return;
                }
                await peerConnection.current.setRemoteDescription(new react_native_webrtc_1.RTCSessionDescription(data.rtcMessage));
                await processingPendingIceCandidates();
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                socket.emit('callAnswered', {
                    callerName: data.callerName,
                    receiverName,
                    rtcMessage: answer
                });
            }
            catch (error) {
                console.error('Error handling incoming call', error);
                setConnectionState('failed');
            }
        });
        socket.on('callAnswered', async (data) => {
            try {
                if (!peerConnection.current) {
                    return;
                }
                await peerConnection.current.setRemoteDescription(new react_native_webrtc_1.RTCSessionDescription(data.rtcMessage));
                await processingPendingIceCandidates();
            }
            catch (error) {
                console.error('Error handling call answer', error);
                setConnectionState('failed');
            }
        });
        socket.on('ICEcandidate', async (data) => {
            try {
                const { candidate, id, label } = data.rtcMessage;
                const iceCandidate = new react_native_webrtc_1.RTCIceCandidate({
                    candidate,
                    sdpMid: id,
                    sdpMLineIndex: label
                });
                if (peerConnection.current?.remoteDescription) {
                    await peerConnection.current.addIceCandidate(iceCandidate);
                }
                else {
                    pendingIceCandidates.current.push(iceCandidate);
                }
            }
            catch (error) {
                console.error('Error adding ICE candidate', error);
            }
        });
        socket.on('callEnded', () => {
            finishCall(false);
        });
    }, [
        socket,
        receiverName,
        isCaller,
        createOffer,
        processingPendingIceCandidates,
        finishCall
    ]);
    const initCall = (0, react_1.useCallback)(async () => {
        try {
            if (isInitialized.current || peerConnection.current) {
                return;
            }
            isInitialized.current = true;
            endedRef.current = false;
            setConnectionState('connecting');
            if (!socket || !socket.connected) {
                setConnectionState('failed');
                return;
            }
            setupSocketHandlers();
            await new Promise((resolve) => {
                socket.emit('joinCallRoom', { roomName: receiverName }, () => resolve());
            });
            peerConnection.current = createPeerConnection();
            const stream = await initMedia();
            stream.getTracks().forEach((track) => {
                peerConnection.current?.addTrack(track, stream);
            });
            socket.emit('peerReady', {
                roomName: receiverName,
                callerName,
                receiverName
            });
            if (isCaller) {
                offerTimeoutRef.current = setTimeout(async () => {
                    if (!offerSentRef.current) {
                        try {
                            await createOffer();
                        }
                        catch (error) {
                            console.error('Fallback offer failed', error);
                            setConnectionState('failed');
                        }
                    }
                }, Math.min(offerTimeoutMs, 2000));
            }
        }
        catch (error) {
            console.error('Error init call', error);
            setConnectionState('failed');
        }
    }, [
        socket,
        receiverName,
        callerName,
        isCaller,
        setupSocketHandlers,
        createPeerConnection,
        initMedia,
        createOffer,
        offerTimeoutMs
    ]);
    (0, react_1.useEffect)(() => {
        intervalRef.current = setInterval(() => {
            setElapsed((prev) => {
                const next = prev + 1;
                elapsedRef.current = next;
                return next;
            });
        }, 1000);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (socket) {
            initCall();
        }
        return () => {
            if (!endedRef.current) {
                cleanup();
            }
            if (socket) {
                socket.off('newCall');
                socket.off('callAnswered');
                socket.off('ICEcandidate');
                socket.off('callEnded');
                socket.off('peerReady');
                socket.off('peerJoined');
            }
        };
        // Intentionally mount-once for call lifetime
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handleHangUp = (0, react_1.useCallback)(() => {
        finishCall(true);
    }, [finishCall]);
    const switchCamera = (0, react_1.useCallback)(async () => {
        if (!localStreamRef.current) {
            return;
        }
        try {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack?._switchCamera) {
                videoTrack._switchCamera();
                setIsFrontCamera((prev) => !prev);
                return;
            }
            if (videoTrack?.applyConstraints) {
                await videoTrack.applyConstraints({
                    facingMode: isFrontCamera ? 'environment' : 'user'
                });
                setIsFrontCamera((prev) => !prev);
            }
        }
        catch (error) {
            console.error('Error switching camera:', error);
        }
    }, [isFrontCamera]);
    const toggleCamera = (0, react_1.useCallback)(() => {
        if (!localStreamRef.current) {
            return;
        }
        setIsCameraOn((prev) => {
            const next = !prev;
            localStreamRef.current?.getVideoTracks().forEach((track) => {
                track.enabled = next;
            });
            return next;
        });
    }, []);
    const toggleMic = (0, react_1.useCallback)(() => {
        if (!localStreamRef.current) {
            return;
        }
        setIsMicOn((prev) => {
            const next = !prev;
            localStreamRef.current?.getAudioTracks().forEach((track) => {
                track.enabled = next;
            });
            return next;
        });
    }, []);
    const renderVideoStream = (stream, style, shouldMirror = false) => {
        if (!stream) {
            return null;
        }
        return (<react_native_webrtc_1.RTCView streamURL={stream.toURL()} style={style} objectFit="cover" mirror={shouldMirror}/>);
    };
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.View style={styles.topBar}>
        <react_native_1.View style={styles.userInfo}>
          {avatarUrl && <react_native_1.Image source={{ uri: avatarUrl }} style={styles.avatar}/>}
          <react_native_1.Text style={styles.username}>
            {currentUser === callerName ? receiverName : callerName}
          </react_native_1.Text>
        </react_native_1.View>
        <react_native_1.View style={styles.timerContainer}>
          <react_native_1.View style={[
            styles.redDot,
            {
                backgroundColor: connectionState === 'connected'
                    ? '#00ff00'
                    : connectionState === 'connecting'
                        ? '#ffff00'
                        : '#ff0000'
            }
        ]}/>
          <react_native_1.Text style={styles.timerText}>{(0, formatTime_1.formatTime)(elapsed)}</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={styles.mainVideoContainer}>
        {remoteStream
            ? renderVideoStream(remoteStream, styles.mainVideo)
            : avatarUrl && (<react_native_1.Image source={{ uri: avatarUrl }} style={styles.mainVideo} resizeMode="cover"/>)}

        <react_native_1.View style={styles.selfViewContainer}>
          {localStream && isCameraOn
            ? renderVideoStream(localStream, styles.selfView, isFrontCamera)
            : localAvatarUrl && (<react_native_1.Image source={{ uri: localAvatarUrl }} style={styles.selfView} resizeMode="cover"/>)}
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={styles.controlsContainer}>
        <react_native_1.TouchableOpacity style={[styles.controlButton, isCameraOn && { backgroundColor: '#007FFF' }]} onPress={toggleCamera}>
          <react_native_1.Text style={styles.controlText}>{isCameraOn ? 'Camera On' : 'Camera Off'}</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        <react_native_1.TouchableOpacity style={[styles.controlButton, isMicOn && { backgroundColor: '#007FFF' }]} onPress={toggleMic}>
          <react_native_1.Text style={styles.controlText}>{isMicOn ? 'Mic On' : 'Mic Off'}</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        <react_native_1.TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
          <react_native_1.Text style={styles.controlText}>Flip</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        <react_native_1.TouchableOpacity style={styles.controlButton} onPress={handleHangUp}>
          <react_native_1.Text style={styles.controlText}>End</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.SafeAreaView>);
};
exports.VideoCallScreen = VideoCallScreen;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#444'
    },
    topBar: {
        backgroundColor: '#007aff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: react_native_1.Platform.OS === 'android' ? 60 : 16,
        paddingBottom: 16
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        resizeMode: 'cover'
    },
    username: {
        color: '#fff',
        fontWeight: '700'
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    redDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff3b30',
        marginRight: 6
    },
    timerText: {
        color: '#fff',
        fontWeight: '500'
    },
    mainVideoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    mainVideo: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    selfViewContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 100,
        height: 140,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#222'
    },
    selfView: {
        width: '100%',
        height: '100%',
        borderRadius: 16
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10
    },
    controlButton: {
        backgroundColor: '#ff3b30',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8
    },
    controlText: {
        color: '#fff',
        fontWeight: 'bold'
    }
});
//# sourceMappingURL=VideoCallScreen.js.map