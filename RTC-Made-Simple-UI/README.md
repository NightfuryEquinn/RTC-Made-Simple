# RTC-Made-Simple-UI

React Native video calling components with WebRTC support.

## Installation

```bash
npm install @nightfuryequinn/rtc-made-simple-ui
```

### Peer Dependencies

Make sure you have these peer dependencies installed:

```bash
npm install socket.io-client react-native-webrtc react-native-incall-manager zustand
```

## Usage

### Basic Setup

```typescript
import { useVideoSocket, VideoCallScreen, CallOverlay } from '@maidx/video-call-react-native';

export default function App() {
  const currentUser = 'user123';
  const baseUrl = 'http://your-server.com';

  const { 
    incomingCall, 
    isCallVisible, 
    acceptCall, 
    declineCall, 
    initiateCall 
  } = useVideoSocket({
    currentUser,
    baseUrl,
    onCallAccepted: (data) => {
      // Navigate to video call screen
      navigation.navigate('VideoCall', {
        conversationId: data.conversationId,
        callerName: data.callerName,
        receiverName: data.receiverName
      });
    },
    onCallDeclined: (data) => {
      console.log('Call declined:', data.reason);
    },
    onCallEnded: (data) => {
      console.log('Call ended by:', data.endedBy);
    }
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}
      
      {/* Call overlay for incoming calls */}
      <CallOverlay
        onAccept={acceptCall}
        onDecline={declineCall}
        avatarUrl="https://example.com/avatar.jpg"
      />
    </View>
  );
}
```

### Video Call Screen

```typescript
import { VideoCallScreen } from '@maidx/video-call-react-native';

export default function VideoCall({ route, navigation }) {
  const { conversationId, callerName, receiverName } = route.params;
  const currentUser = 'user123';

  const handleCallEnd = (duration: string) => {
    console.log('Call ended, duration:', duration);
    navigation.goBack();
  };

  return (
    <VideoCallScreen
      currentUser={currentUser}
      conversationId={conversationId}
      receiverName={receiverName}
      callerName={callerName}
      onCallEnd={handleCallEnd}
      avatarUrl="https://example.com/receiver-avatar.jpg"
      localAvatarUrl="https://example.com/my-avatar.jpg"
      iceServers={[
        { urls: 'stun:stun.l.google.com:19302' },
        // Add your TURN servers here for production
      ]}
    />
  );
}
```

### Initiating a Call

```typescript
import { useVideoSocket } from '@maidx/video-call-react-native';

export default function ChatScreen() {
  const { initiateCall } = useVideoSocket({
    currentUser: 'user123',
    baseUrl: 'http://your-server.com'
  });

  const handleStartCall = () => {
    initiateCall('receiver-username', 12345); // conversationId
  };

  return (
    <TouchableOpacity onPress={handleStartCall}>
      <Text>Start Video Call</Text>
    </TouchableOpacity>
  );
}
```

## Configuration

### Custom ICE Servers

For production use, you should configure TURN servers:

```typescript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'username',
    credential: 'password'
  }
];

<VideoCallScreen
  // ... other props
  iceServers={iceServers}
/>
```

### Custom Media Constraints

```typescript
const mediaConstraints = {
  audio: true,
  video: {
    width: 640,
    height: 480,
    frameRate: 24,
    facingMode: 'user'
  }
};

<VideoCallScreen
  // ... other props
  mediaConstraints={mediaConstraints}
/>
```

## Platform Setup

### Android

Add permission to `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### iOS

Add permissions to `ios/YourApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone for video calls</string>
```

## API Reference

### useVideoSocket

Hook for managing video call WebSocket connection.

**Parameters:**
- `currentUser: string` - Current user identifier
- `baseUrl: string` - WebSocket server URL
- `onCallAccepted?: (data: CallAcceptedData) => void` - Call accepted callback
- `onCallDeclined?: (data: CallDeclinedData) => void` - Call declined callback
- `onCallEnded?: (data: CallEndedData) => void` - Call ended callback

**Returns:**
- `incomingCall: IncomingCallData | null` - Current incoming call data
- `isCallVisible: boolean` - Whether call overlay should be visible
- `acceptCall: () => void` - Accept incoming call
- `declineCall: (reason?: string) => void` - Decline incoming call
- `initiateCall: (receiverName: string, conversationId: number) => void` - Start a call
- `cancelCall: () => void` - Cancel outgoing call

### VideoCallScreen

Component for video call interface.

**Props:**
- `currentUser: string` - Current user identifier
- `conversationId: number` - Conversation ID
- `receiverName: string` - Receiver username
- `callerName: string` - Caller username
- `onCallEnd: (duration: string) => void` - Call end callback
- `iceServers?: RTCIceServer[]` - WebRTC ICE servers
- `mediaConstraints?: MediaStreamConstraints` - Media constraints
- `avatarUrl?: string` - Receiver avatar URL
- `localAvatarUrl?: string` - Local user avatar URL

### CallOverlay

Component for incoming call overlay.

**Props:**
- `onAccept: () => void` - Accept call callback
- `onDecline: () => void` - Decline call callback
- `avatarUrl?: string` - Caller avatar URL