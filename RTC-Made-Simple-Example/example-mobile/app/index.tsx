import { CallOverlay, useVideoSocket } from "@nightfuryequinn/rtc-made-simple-ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Device from 'expo-device';

export default function Index() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('');
  const [chatRoomName, setChatRoomName] = useState<string>('general');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get device name and set default receiver
    const initializeDeviceInfo = async () => {
      try {
        const deviceName = Device.deviceName || `${Platform.OS}-${Device.modelName}` || Platform.OS;
        setCurrentUser(deviceName);
        
        console.log('Device initialized:', deviceName);
      } catch (error) {
        console.error('Error getting device info:', error);
        setCurrentUser(`${Platform.OS}-device`);
        setReceiverName('other-device');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDeviceInfo();
  }, []);
  
  const { 
    incomingCall, 
    isCallVisible, 
    acceptCall, 
    declineCall, 
    cancelCall,
    initiateCall 
  } = useVideoSocket({
    currentUser,
    baseUrl: Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000',
    onCallAccepted: (data) => {
      console.log('Call accepted - navigating to video call:', data);

      // Both caller and receiver will navigate when call is accepted
      router.push({
        pathname: '/video-call',
        params: {
          conversationId: data.conversationId,
          callerName: data.callerName,
          receiverName: data.receiverName
        }
      });
    },
    onCallDeclined: (data) => {
      console.log('Call declined:', data.reason);
    },
    onCallEnded: (data) => {
      console.log('Call ended by:', data.endedBy);
    }
  });

  // Wrap acceptCall to ensure navigation after accepting
  const handleAcceptCall = () => {
    const call = incomingCall;
    if (!call) return;
    
    acceptCall();
    
    // Navigate immediately when accepting
    router.push({
      pathname: '/video-call',
      params: {
        conversationId: call.conversationId,
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
    initiateCall(receiverName, 12345); // conversationId: 12345
  };

  const handleOpenChat = () => {
    if (!chatRoomName.trim()) {
      alert('Please enter chat room name');
      return;
    }
    router.push({
      pathname: '/chat',
      params: {
        roomName: chatRoomName
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
      </View>

      {/* Video Call Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📹 Video Call</Text>
        <Text style={styles.label}>Call To:</Text>
        <TextInput
          style={styles.input}
          value={receiverName}
          onChangeText={setReceiverName}
          placeholder="Enter receiver device name"
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleStartCall}
        >
          <Text style={styles.buttonText}>Start Video Call</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Chat</Text>
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
      </View>

      {/* Call overlay for incoming calls */}
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
