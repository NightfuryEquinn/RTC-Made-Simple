import { VideoCallScreen } from '@nightfuryequinn/rtc-made-simple-ui';
import * as Device from 'expo-device';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function VideoCall() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { conversationId, callerName, receiverName } = params;
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeDeviceInfo = async () => {
      try {
        const deviceName =
          Device.deviceName || `${Device.osName}-${Device.modelName}` || 'device';
        setCurrentUser(deviceName);
      } catch (error) {
        console.error('Error getting device info:', error);
        setCurrentUser('device');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDeviceInfo();
  }, []);

  const handleCallEnd = (duration: string) => {
    console.log('Call ended, duration:', duration);
    router.back();
  };

  if (isLoading || !currentUser) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <VideoCallScreen
      currentUser={currentUser}
      conversationId={Number(conversationId)}
      receiverName={receiverName as string}
      callerName={callerName as string}
      onCallEnd={handleCallEnd}
      avatarUrl="https://via.placeholder.com/150"
      localAvatarUrl="https://via.placeholder.com/150"
      iceServers={[
        { urls: 'stun:stun.l.google.com:19302' }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
