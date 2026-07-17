import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import InCallManager from "react-native-incall-manager";
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView
} from "react-native-webrtc";
import { Constraints } from "react-native-webrtc/lib/typescript/getUserMedia";
import { formatTime } from "../helpers/formatTime";
import { getVideoSocket } from "../socket";

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
  offerTimeoutMs?: number;
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
  localAvatarUrl,
  offerTimeoutMs = 15000
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>('connecting');

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const elapsedRef = useRef(0);
  const endedRef = useRef(false);
  const isInitialized = useRef(false);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
  const socketHandlersSet = useRef(false);
  const offerSentRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCallEndRef = useRef(onCallEnd);

  const socket = getVideoSocket();
  const isCaller = currentUser === callerName;

  useEffect(() => {
    onCallEndRef.current = onCallEnd;
  }, [onCallEnd]);

  const cleanup = useCallback(() => {
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
      InCallManager.stop();
    } catch {
      // no-op when InCallManager is unavailable in tests/web
    }
  }, []);

  const finishCall = useCallback(
    (shouldEmitEnd: boolean) => {
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

      const duration = formatTime(elapsedRef.current);
      cleanup();
      onCallEndRef.current(duration);
    },
    [socket, callerName, receiverName, conversationId, currentUser, cleanup]
  );

  const processingPendingIceCandidates = useCallback(async () => {
    if (!peerConnection.current?.remoteDescription) {
      return;
    }

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

  const createOffer = useCallback(async () => {
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

  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    const pc = new RTCPeerConnection({
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

  const initMedia = useCallback(async (): Promise<MediaStream> => {
    InCallManager.start();
    InCallManager.setKeepScreenOn(true);
    InCallManager.setForceSpeakerphoneOn(true);

    const stream = await mediaDevices.getUserMedia(mediaConstraints);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, [mediaConstraints]);

  const setupSocketHandlers = useCallback(() => {
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

    socket.on('peerReady', async (data: { userName: string }) => {
      if (isCaller && data.userName === receiverName) {
        try {
          await createOffer();
        } catch (error) {
          console.error('Error creating offer after peerReady', error);
          setConnectionState('failed');
        }
      }
    });

    socket.on('peerJoined', async (data: { userName: string }) => {
      if (isCaller && data.userName === receiverName && !offerSentRef.current) {
        // Receiver joined the room; wait for peerReady for media readiness.
      }
    });

    socket.on('newCall', async (data: { callerName: string; rtcMessage: any }) => {
      try {
        if (!peerConnection.current) {
          return;
        }

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.rtcMessage)
        );
        await processingPendingIceCandidates();

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit('callAnswered', {
          callerName: data.callerName,
          receiverName,
          rtcMessage: answer
        });
      } catch (error) {
        console.error('Error handling incoming call', error);
        setConnectionState('failed');
      }
    });

    socket.on(
      'callAnswered',
      async (data: { callerName: string; receiverName: string; rtcMessage: any }) => {
        try {
          if (!peerConnection.current) {
            return;
          }

          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data.rtcMessage)
          );
          await processingPendingIceCandidates();
        } catch (error) {
          console.error('Error handling call answer', error);
          setConnectionState('failed');
        }
      }
    );

    socket.on('ICEcandidate', async (data: { sender: string; rtcMessage: any }) => {
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

  const initCall = useCallback(async () => {
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

      await new Promise<void>((resolve) => {
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
            } catch (error) {
              console.error('Fallback offer failed', error);
              setConnectionState('failed');
            }
          }
        }, Math.min(offerTimeoutMs, 2000));
      }
    } catch (error) {
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

  useEffect(() => {
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

  useEffect(() => {
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

  const handleHangUp = useCallback(() => {
    finishCall(true);
  }, [finishCall]);

  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) {
      return;
    }

    try {
      const videoTrack = localStreamRef.current.getVideoTracks()[0] as any;
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
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  }, [isFrontCamera]);

  const toggleCamera = useCallback(() => {
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

  const toggleMic = useCallback(() => {
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

  const renderVideoStream = (
    stream: MediaStream | null,
    style: any,
    shouldMirror: boolean = false
  ) => {
    if (!stream) {
      return null;
    }

    return (
      <RTCView
        streamURL={stream.toURL()}
        style={style}
        objectFit="cover"
        mirror={shouldMirror}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.userInfo}>
          {avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.avatar} />}
          <Text style={styles.username}>
            {currentUser === callerName ? receiverName : callerName}
          </Text>
        </View>
        <View style={styles.timerContainer}>
          <View
            style={[
              styles.redDot,
              {
                backgroundColor:
                  connectionState === 'connected'
                    ? '#00ff00'
                    : connectionState === 'connecting'
                      ? '#ffff00'
                      : '#ff0000'
              }
            ]}
          />
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      <View style={styles.mainVideoContainer}>
        {remoteStream
          ? renderVideoStream(remoteStream, styles.mainVideo)
          : avatarUrl && (
              <Image source={{ uri: avatarUrl }} style={styles.mainVideo} resizeMode="cover" />
            )}

        <View style={styles.selfViewContainer}>
          {localStream && isCameraOn
            ? renderVideoStream(localStream, styles.selfView, isFrontCamera)
            : localAvatarUrl && (
                <Image
                  source={{ uri: localAvatarUrl }}
                  style={styles.selfView}
                  resizeMode="cover"
                />
              )}
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isCameraOn && { backgroundColor: '#007FFF' }]}
          onPress={toggleCamera}
        >
          <Text style={styles.controlText}>{isCameraOn ? 'Camera On' : 'Camera Off'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isMicOn && { backgroundColor: '#007FFF' }]}
          onPress={toggleMic}
        >
          <Text style={styles.controlText}>{isMicOn ? 'Mic On' : 'Mic Off'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
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
    backgroundColor: '#444'
  },
  topBar: {
    backgroundColor: '#007aff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 16,
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
