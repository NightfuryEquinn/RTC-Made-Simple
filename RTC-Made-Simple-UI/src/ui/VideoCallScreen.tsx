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
    width: 640,
    height: 480,
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
      console.log('Track received:', event.streams.length, 'track kind:', event.track?.kind);
      const [stream] = event.streams;
      if (stream) {
        console.log('Setting remote stream with', stream.getTracks().length, 'tracks');
        setRemoteStream(stream);
        setConnectionState('connected');
      }
    });

    // @ts-ignore
    pc.addEventListener('icecandidate', (event) => {
      if (event.candidate && socket) {
        console.log('Sending ICE candidate');
        socket.emit('ICEcandidate', {
          callerName,
          receiverName,
          rtcMessage: {
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
          }
        });
      } else if (!event.candidate) {
        console.log('ICE gathering completed');
      }
    });

    // @ts-ignore
    pc.addEventListener('connectionstatechange', () => {
      const state = pc.connectionState;
      console.log('Connection state changed:', state);
      setConnectionState(state);
    });

    // @ts-ignore
    pc.addEventListener('iceconnectionstatechange', () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    });

    // @ts-ignore
    pc.addEventListener('icegatheringstatechange', () => {
      console.log('ICE gathering state:', pc.iceGatheringState);
    });

    console.log('New peer connection created');
    return pc;
  }, [iceServers, socket, callerName, receiverName]);

  const initMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      InCallManager.start();
      InCallManager.setKeepScreenOn(true);
      InCallManager.setForceSpeakerphoneOn(true);

      console.log('Requesting media with constraints:', JSON.stringify(mediaConstraints));
      const stream = await mediaDevices.getUserMedia(mediaConstraints);
      console.log('Got media stream with tracks:', stream.getTracks().map(t => t.kind).join(', '));
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error init media', error);
      throw error;
    }
  }, [mediaConstraints]);

  const setupSocketHandlers = useCallback(() => {
    if (!socket || socketHandlersSet.current) return;
    socketHandlersSet.current = true;

    console.log('Setting up socket handlers, socket connected:', socket.connected);
    
    socket.off('newCall');
    socket.off('callAnswered');
    socket.off('ICEcandidate');
    socket.off('callEnded');

    socket.on('newCall', async (data: { callerName: string, rtcMessage: any }) => {
      try {
        console.log('RECEIVED INCOMING CALL OFFER from', data.callerName, 'with SDP type:', data.rtcMessage?.type);

        if (!peerConnection.current) {
          console.error('Peer connection not initialized');
          return;
        }

        console.log('Setting remote description (offer)');
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.rtcMessage)
        );

        console.log('Processing pending ICE candidates');
        await processingPendingIceCandidates();

        console.log('Creating answer');
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit('callAnswered', {
          callerName: data.callerName,
          receiverName: receiverName,
          rtcMessage: answer
        });

        console.log('Answer sent to', data.callerName);
      } catch (error) {
        console.error('Error handling incoming call', error);
        setConnectionState('failed');
      }
    });

    socket.on('callAnswered', async (data: { callerName: string, receiverName: string, rtcMessage: any }) => {
      try {
        console.log('Received call answer from', data.callerName);

        if (!peerConnection.current) {
          console.error('Peer connection not initialized');
          return;
        }

        console.log('Setting remote description (answer)');
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.rtcMessage)
        );

        console.log('Processing pending ICE candidates');
        await processingPendingIceCandidates();
        console.log('Call answer processed successfully');
      } catch (error) {
        console.error('Error handling call answer', error);
        setConnectionState('failed');
      }
    });

    socket.on('ICEcandidate', async (data: { sender: string, rtcMessage: any }) => {
      try {
        console.log('Received ICE candidate from', data.sender);
        const { candidate, id, label } = data.rtcMessage;
        const iceCandidate = new RTCIceCandidate({
          candidate,
          sdpMid: id,
          sdpMLineIndex: label
        });
        
        if (peerConnection.current?.remoteDescription) {
          console.log('Adding ICE candidate immediately');
          await peerConnection.current.addIceCandidate(iceCandidate);
        } else {
          console.log('Queuing ICE candidate - remote description not set yet');
          pendingIceCandidates.current.push(iceCandidate);
        }
      } catch (error) {
        console.error('Error adding ICE candidate', error);
      }
    });

    socket.on('callEnded', async () => {
      console.log('Call ended by remote peer');
      socket.emit('joinCallRoom', { roomName: currentUser });

      const formattedDuration = formatTime(elapsed);
      cleanup();
      onCallEnd(formattedDuration);
    });

    console.log('All socket handlers registered successfully');
  }, [socket, receiverName, processingPendingIceCandidates, currentUser, elapsed, cleanup, onCallEnd]);

  const initCall = useCallback(async () => {
    try {
      if (isInitialized.current || peerConnection.current) {
        console.log('Already initialized, skipping');
        return;
      }
      isInitialized.current = true;

      console.log('Initializing call...');
      console.log('Current user:', currentUser, 'Caller:', callerName, 'Receiver:', receiverName);
      setConnectionState('connecting');

      // Check socket connection
      if (!socket) {
        console.error('Socket is not available');
        setConnectionState('failed');
        return;
      }

      if (!socket.connected) {
        console.error('Socket is not connected');
        setConnectionState('failed');
        return;
      }

      console.log('Socket is connected, ID:', socket.id);

      // Setup socket handlers FIRST before joining room
      setupSocketHandlers();

      // Both users must join the receiver's room for WebRTC signaling
      socket.emit('joinCallRoom', { roomName: receiverName });
      console.log(`${currentUser} joined call room ${receiverName}`);

      // Wait a bit to ensure the room join is processed
      await new Promise(resolve => setTimeout(resolve, 100));

      peerConnection.current = createPeerConnection();
      console.log('Getting user media...');
      const stream = await initMedia();
      
      console.log('Adding tracks to peer connection:', stream.getTracks().length);
      stream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind, 'enabled:', track.enabled);
        peerConnection.current?.addTrack(track, stream);
      });

      if (currentUser === callerName) {
        // Caller waits a bit longer to ensure receiver is ready
        console.log('Waiting for receiver to be ready...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Creating offer as caller');
        const offer = await peerConnection.current?.createOffer();
        await peerConnection.current?.setLocalDescription(offer);

        console.log('Sending offer to receiver in room:', receiverName);
        socket?.emit('newCall', {
          receiverName,
          rtcMessage: offer
        });

        console.log('Offer sent to', receiverName);
      } else {
        console.log('Ready as receiver, waiting for offer in room:', receiverName);
      }
    } catch (error) {
      console.error('Error init call', error);
      setConnectionState('failed');
    }
  }, [currentUser, callerName, receiverName, socket, createPeerConnection, initMedia, setupSocketHandlers]);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (remoteStream) {
      console.log('Remote stream updated:', {
        id: remoteStream.id,
        active: remoteStream.active,
        tracks: remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          id: t.id
        }))
      });
    } else {
      console.log('Remote stream is null');
    }
  }, [remoteStream]);

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