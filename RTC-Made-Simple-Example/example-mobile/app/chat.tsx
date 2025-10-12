import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Platform, 
  KeyboardAvoidingView, 
  SafeAreaView 
} from 'react-native';
import { ChatWindow } from '@nightfuryequinn/rtc-made-simple-ui';
import { useLocalSearchParams } from 'expo-router';
import * as Device from 'expo-device';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Get roomName from params or default to 'general'
  const roomName = (params.roomName as string) || 'general';

  useEffect(() => {
    const initializeDeviceInfo = async () => {
      try {
        const deviceName = Device.deviceName || `${Platform.OS}-${Device.modelName}` || Platform.OS;
        setCurrentUser(deviceName);
        console.log('Device initialized for chat:', deviceName);
      } catch (error) {
        console.error('Error getting device info:', error);
        setCurrentUser(`${Platform.OS}-device`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDeviceInfo();
  }, []);

  if (isLoading || !currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* You can add a loading spinner here */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ChatWindow
          userName={currentUser}
          roomName={roomName}
          baseUrl={Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000'}
          placeholder="Type a message..."
          emptyStateText="No messages yet. Start the conversation!"
          showTypingIndicator={true}
          onMessageReceived={(message) => {
            console.log('📨 New message received:', message);
            // Add custom logic: play notification sound, show banner, etc.
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
