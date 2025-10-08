import { CallOverlay, useVideoSocket } from "@nightfuryequinn/rtc-made-simple-ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();
  
  const [currentUser] = useState(Platform.OS === 'android' ? 'user123' : 'user456');
  const [receiverName] = useState(Platform.OS === 'android' ? 'user456' : 'user123');
  
  const { 
    incomingCall, 
    isCallVisible, 
    acceptCall, 
    declineCall, 
    initiateCall 
  } = useVideoSocket({
    currentUser,
    baseUrl: Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000', // Your backend URL
    onCallAccepted: (data) => {
      console.log('Call accepted:', data);

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

  const handleStartCall = () => {
    initiateCall(receiverName, 12345); // conversationId: 12345
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RTC Made Simple - Video Call Demo</Text>
      
      <View style={styles.userInfo}>
        <Text>Current User: {currentUser}</Text>
        <Text>Receiver: {receiverName}</Text>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleStartCall}
      >
        <Text style={styles.buttonText}>Start Video Call</Text>
      </TouchableOpacity>

      {/* Call overlay for incoming calls */}
      {isCallVisible && incomingCall && (
        <CallOverlay
          onAccept={acceptCall}
          onDecline={declineCall}
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userInfo: {
    marginBottom: 30,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
