import { VideoCallScreen } from '@nightfuryequinn/rtc-made-simple-ui';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function VideoCall() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { conversationId, callerName, receiverName } = params;
  const currentUser = 'user123'; // Get from your auth state

  const handleCallEnd = (duration: string) => {
    console.log('Call ended, duration:', duration);
    router.back();
  };

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
        { urls: 'stun:stun.l.google.com:19302' },
        // Add your TURN servers here for production
      ]}
    />
  );
}
