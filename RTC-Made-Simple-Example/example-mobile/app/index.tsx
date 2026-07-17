import { CallOverlay, useVideoSocket } from "@nightfuryequinn/rtc-made-simple-ui";
import * as Device from 'expo-device';
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const DEFAULT_HOST =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

/**
 * For physical devices, set EXPO_PUBLIC_RTC_SERVER_URL to your machine LAN IP,
 * e.g. http://192.168.1.20:3000
 */
const resolveBaseUrl = () =>
  process.env.EXPO_PUBLIC_RTC_SERVER_URL?.trim() || DEFAULT_HOST;

export default function Index() {
  const router = useRouter();
  const baseUrl = useMemo(() => resolveBaseUrl(), []);

  const [currentUser, setCurrentUser] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('');
  const [chatRoomName, setChatRoomName] = useState<string>('general');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeDeviceInfo = async () => {
      try {
        const deviceName =
          Device.deviceName || `${Platform.OS}-${Device.modelName}` || Platform.OS;
        setCurrentUser(deviceName);
      } catch (error) {
        console.error('Error getting device info:', error);
        setCurrentUser(`${Platform.OS}-device`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDeviceInfo();
  }, []);

  const handleCallAccepted = useCallback(
    (data: {
      conversationId: number;
      callerName: string;
      receiverName: string;
    }) => {
      router.push({
        pathname: '/video-call',
        params: {
          conversationId: String(data.conversationId),
          callerName: data.callerName,
          receiverName: data.receiverName
        }
      });
    },
    [router]
  );

  const {
    incomingCall,
    isCallVisible,
    acceptCall,
    declineCall,
    cancelCall,
    initiateCall
  } = useVideoSocket({
    currentUser,
    baseUrl,
    onCallAccepted: handleCallAccepted,
    onCallDeclined: (data) => {
      console.log('Call declined:', data.reason);
    },
    onCallEnded: (data) => {
      console.log('Call ended:', data.reason || data.endedBy);
    }
  });

  const handleAcceptCall = () => {
    const call = incomingCall;
    if (!call) {
      return;
    }

    acceptCall();
    router.push({
      pathname: '/video-call',
      params: {
        conversationId: String(call.conversationId),
        callerName: call.callerName,
        receiverName: call.receiverName
      }
    });
  };

  const handleStartCall = () => {
    if (!receiverName.trim()) {
      alert('Please enter receiver name');
      return;
    }
    initiateCall(receiverName.trim(), Date.now());
  };

  const handleOpenChat = () => {
    if (!chatRoomName.trim()) {
      alert('Please enter chat room name');
      return;
    }
    router.push({
      pathname: '/chat',
      params: {
        roomName: chatRoomName.trim()
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading device info...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RTC Made Simple Demo</Text>

      <View style={styles.userInfo}>
        <Text style={styles.label}>This Device (You):</Text>
        <Text style={styles.deviceName}>{currentUser}</Text>
        <Text style={styles.hint}>Server: {baseUrl}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Video Call</Text>
        <Text style={styles.label}>Call To:</Text>
        <TextInput
          style={styles.input}
          value={receiverName}
          onChangeText={setReceiverName}
          placeholder="Enter receiver device name"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.button} onPress={handleStartCall}>
          <Text style={styles.buttonText}>Start Video Call</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chat</Text>
        <Text style={styles.label}>Room Name:</Text>
        <TextInput
          style={styles.input}
          value={chatRoomName}
          onChangeText={setChatRoomName}
          placeholder="Enter chat room name"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.button, styles.chatButton]}
          onPress={handleOpenChat}
        >
          <Text style={styles.buttonText}>Open Chat Room</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/chat-rooms')}
        >
          <Text style={styles.buttonText}>Browse Chat Rooms</Text>
        </TouchableOpacity>
      </View>

      {isCallVisible && incomingCall && (
        <CallOverlay
          currentUser={currentUser}
          onAccept={handleAcceptCall}
          onDecline={declineCall}
          onCancel={cancelCall}
          avatarUrl="https://via.placeholder.com/150"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  userInfo: {
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  section: {
    width: '100%',
    marginBottom: 25,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 5,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatButton: {
    backgroundColor: '#34C759',
  },
  secondaryButton: {
    backgroundColor: '#5856D6',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
