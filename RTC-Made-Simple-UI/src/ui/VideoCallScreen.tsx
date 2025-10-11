import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import InCallManager from "react-native-incall-manager";
import { mediaDevices, MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, RTCView } from "react-native-webrtc";
import { Constraints } from "react-native-webrtc/lib/typescript/getUserMedia";
import { formatTime } from "../helpers/formatTime";
import { getVideoSocket } from "../socket";

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
];

const DEFAULT_MEDIA_CONSTRAINTS = {
  audio: true,
  video: {
    width: 1280,
    height: 720,
    frameRate: 30,
    facingMode: 'user'
  }
};

interface VideoCallScreenProps {
  currentUser: string;
  conversationId: number;
  receiverName: string;
  callerName: string;
  onCallEnd: (duration: string) => void;
  iceServers?: RTCIceServer[];
  mediaConstraints?: Constraints;
  avatarUrl?: string;
  localAvatarUrl?: string;
}

export const VideoCallScreen: React.FC<VideoCallScreenProps> = ({
  currentUser,
  conversationId,
  receiverName,
  callerName,
  onCallEnd,
  iceServers = DEFAULT_ICE_SERVERS,
  mediaConstraints = DEFAULT_MEDIA_CONSTRAINTS,
  avatarUrl,
  localAvatarUrl
}) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('connecting');

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const isInitialized = useRef(false);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
  const socketHandlersSet = useRef(false);

  const socket = getVideoSocket();

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  
    // Close peer connection first
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  
    // Stop media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  
    setLocalStream(null);
    setRemoteStream(null);
    pendingIceCandidates.current = [];
    socketHandlersSet.current = false;
    isInitialized.current = false;
  
    InCallManager.stop();
  }, [localStream]);

  const handleHangUp = useCallback(() => {
    if (socket) {
      socket.emit('endCall', {
        callerName,
        receiverName,
        conversationId
      });

      socket.emit('joinCallRoom', { roomName: currentUser });
    }

    cleanup();

    const formattedDuration = formatTime(elapsed);
    
    onCallEnd(formattedDuration);
  }, [elapsed, conversationId, receiverName, cleanup, socket, callerName, currentUser, onCallEnd]);

  const switchCamera = useCallback(async () => {
    if (!localStream) return;

    try {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        await videoTrack.applyConstraints({
          facingMode: isFrontCamera ? 'environment' : 'user'
        });
        setIsFrontCamera(prev => !prev);
      }
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  }, [localStream, isFrontCamera]);

  const toggleCamera = useCallback(() => {
    if (!localStream) return;

    setIsCameraOn(prev => {
      const newState = !prev;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
      return newState;
    });
  }, [localStream]);

  const toggleMic = useCallback(() => {
    if (!localStream) return;

    setIsMicOn(prev => {
      const newState = !prev;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
      return newState;
    });
  }, [localStream]);

  const processingPendingIceCandidates = useCallback(async () => {
    if (!peerConnection.current?.remoteDescription) return;

    const candidates = [...pendingIceCandidates.current];
    pendingIceCandidates.current = [];

    for (const candidate of candidates) {
      try {
        await peerConnection.current?.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding pending ICE candidate', error);
      }
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) {
      console.log('Closing existing peer connection');
      peerConnection.current.close();
      peerConnection.current = null;
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServers,
    });

    // @ts-ignore
    pc.addEventListener('track', (event) => {
      console.log('Track received:', event.streams.length);
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
      const state = pc.connectionState;
      console.log('Connection state changed:', state);
      setConnectionState(state);
    });

    console.log('New peer connection created');
    return pc;
  }, []);

  const initMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      InCallManager.start();
      InCallManager.setKeepScreenOn(true);
      InCallManager.setForceSpeakerphoneOn(true);

      const stream = await mediaDevices.getUserMedia(mediaConstraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error init media', error);
      throw error;
    }
  }, []);

  const setupSocketHandlers = useCallback(() => {
    if (!socket || socketHandlersSet.current) return;
    socketHandlersSet.current = true;

    console.log('Setting up socket handlers');
    
    socket.off('newCall');
    socket.off('callAnswered');
    socket.off('ICEcandidate');
    socket.off('callEnded');

    socket.on('newCall', async (data: { callerName: string, rtcMessage: any }) => {
      try {
        console.log('Received incoming call offer');

        if (!peerConnection.current) return;

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.rtcMessage)
        );

        await processingPendingIceCandidates();

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit('callAnswered', {
          callerName: data.callerName,
          receiverName: receiverName,
          rtcMessage: answer
        });

        console.log('Answer sent');
      } catch (error) {
        console.error('Error handling incoming call', error);
        setConnectionState('failed');
      }
    });

    socket.on('callAnswered', async (data: { callerName: string, receiverName: string, rtcMessage: any }) => {
      try {
        console.log('Received call answer');

        if (!peerConnection.current) return;

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.rtcMessage)
        );

        await processingPendingIceCandidates();
      } catch (error) {
        console.error('Error handling call answer', error);
        setConnectionState('failed');
      }
    });

    socket.on('ICEcandidate', async (data: { sender: string, rtcMessage: any }) => {
      try {
        const { candidate, id, label } = data.rtcMessage;
        const iceCandidate = new RTCIceCandidate({
          candidate,
          sdpMid: id,
          sdpMLineIndex: label
        });
        
        if (peerConnection.current?.remoteDescription) {
          await peerConnection.current.addIceCandidate(iceCandidate);
        } else {
          pendingIceCandidates.current.push(iceCandidate);
        }
      } catch (error) {
        console.error('Error adding ICE candidate', error);
      }
    });

    socket.on('callEnded', async () => {
      socket.emit('joinCallRoom', { roomName: currentUser });

      const formattedDuration = formatTime(elapsed);
      cleanup();
      onCallEnd(formattedDuration);
    });
  }, [socket, receiverName, processingPendingIceCandidates, currentUser]);

  const initCall = useCallback(async () => {
    try {
      if (isInitialized.current || peerConnection.current) return;
      isInitialized.current = true;

      setConnectionState('connecting');

      // Both users must join the receiver's room for WebRTC signaling
      socket?.emit('joinCallRoom', { roomName: receiverName });
      console.log(`${currentUser} joined call room ${receiverName}`);

      peerConnection.current = createPeerConnection();
      const stream = await initMedia();
      stream.getTracks().forEach(track => peerConnection.current?.addTrack(track, stream));

      setupSocketHandlers();

      if (currentUser === callerName) {
        const offer = await peerConnection.current?.createOffer();
        await peerConnection.current?.setLocalDescription(offer);

        socket?.emit('newCall', {
          receiverName,
          rtcMessage: offer
        });

        console.log('Offer sent to', receiverName);
      }
    } catch (error) {
      console.error('Error init call', error);
      setConnectionState('failed');
    }
  }, [currentUser, callerName, receiverName, socket]);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (socket) {
      initCall();
    }

    return () => {
      cleanup();

      if (socket) {
        socket.off('newCall');
        socket.off('callAnswered');
        socket.off('ICEcandidate');
        socket.off('callEnded');
      }
    };
  }, [socket]);

  const renderVideoStream = useCallback((
    stream: MediaStream | null,
    style: any,
    shouldMirror: boolean = false
  ) => {
    if (stream) {
      return (
        <RTCView
          streamURL={stream.toURL()}
          style={style}
          objectFit="cover"
          mirror={shouldMirror}
        />
      );
    }
    return null;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.userInfo}>
          {avatarUrl && (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          )}
          <Text style={styles.username}>{currentUser === callerName ? receiverName : callerName}</Text>
        </View>
        <View style={styles.timerContainer}>
          <View style={[styles.redDot, { 
            backgroundColor: connectionState === 'connected' ? '#00ff00' : 
              connectionState === 'connecting' ? '#ffff00' : '#ff0000' 
            }]} 
          />
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      <View style={styles.mainVideoContainer}>
        {remoteStream ? (
          renderVideoStream(remoteStream, styles.mainVideo)
        ) : (
          avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.mainVideo} resizeMode="cover" />
        )}

        <View style={styles.selfViewContainer}>
          {localStream && isCameraOn ? (
            renderVideoStream(localStream, styles.selfView, isFrontCamera)
          ) : (
            localAvatarUrl && <Image source={{ uri: localAvatarUrl }} style={styles.selfView} resizeMode="cover" />
          )}
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            isCameraOn && { backgroundColor: "#007FFF" },
          ]}
          onPress={toggleCamera}
        >
          <Text style={styles.controlText}>{isCameraOn ? "Camera On" : "Camera Off"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            isMicOn && { backgroundColor: "#007FFF" },
          ]}
          onPress={toggleMic}
        >
          <Text style={styles.controlText}>{isMicOn ? "Mic On" : "Mic Off"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={switchCamera}
        >
          <Text style={styles.controlText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleHangUp}>
          <Text style={styles.controlText}>End</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#444",
  },
  topBar: {
    backgroundColor: "#007aff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 16,
    paddingBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    resizeMode: "cover",
  },
  username: {
    color: "#fff",
    fontWeight: "700",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff3b30",
    marginRight: 6,
  },
  timerText: {
    color: "#fff",
    fontWeight: "500",
  },
  mainVideoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainVideo: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  selfViewContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#222",
  },
  selfView: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  controlButton: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  controlText: {
    color: "#fff",
    fontWeight: "bold",
  },
});