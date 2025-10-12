# RTC-Made-Simple-UI

React Native video calling and chat components with WebRTC support.

## Installation

```bash
npm install @nightfuryequinn/rtc-made-simple-ui
```

### Peer Dependencies

Make sure you have these peer dependencies installed:

```bash
npm install socket.io-client react-native-webrtc react-native-incall-manager zustand
```

## Features

- ✅ WebRTC-based video calling
- ✅ Real-time chat messaging
- ✅ Call overlays and notifications
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message deletion
- ✅ Room-based communication
- ✅ Full TypeScript support

## Usage

### Video Call

#### Basic Setup

```typescript
import { useVideoSocket, VideoCallScreen, CallOverlay } from '@nightfuryequinn/rtc-made-simple-ui';

export default function App() {
  const currentUser = 'user123';
  const baseUrl = 'http://your-server.com';

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
        currentUser={currentUser}
        onAccept={acceptCall}
        onDecline={declineCall}
        onCancel={cancelCall}
        avatarUrl="https://example.com/avatar.jpg"
      />
    </View>
  );
}
```

#### Video Call Screen

```typescript
import { VideoCallScreen } from '@nightfuryequinn/rtc-made-simple-ui';

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

#### Initiating a Call

```typescript
import { useVideoSocket } from '@nightfuryequinn/rtc-made-simple-ui';

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

### Chat

#### Basic Setup with ChatWindow Component

```typescript
import { ChatWindow } from '@nightfuryequinn/rtc-made-simple-ui';

export default function ChatScreen() {
  return (
    <ChatWindow
      userName="user123"
      roomName="general"
      baseUrl="http://your-server.com"
      placeholder="Type a message..."
      emptyStateText="No messages yet. Start the conversation!"
      showTypingIndicator={true}
      onMessageReceived={(message) => {
        console.log('New message:', message);
        // Play notification sound, show banner, etc.
      }}
    />
  );
}
```

#### Advanced Chat Setup with useChatSocket Hook

```typescript
import { useChatSocket } from '@nightfuryequinn/rtc-made-simple-ui';

export default function CustomChatScreen() {
  const {
    messages,
    typingUsers,
    connectedUsers,
    sendMessage,
    joinRoom,
    setTyping,
    markMessageAsRead,
    deleteMessage
  } = useChatSocket({
    userName: 'user123',
    roomName: 'general',
    baseUrl: 'http://your-server.com',
    onMessageReceived: (message) => {
      console.log('New message:', message);
    },
    onUserJoined: (data) => {
      console.log(`${data.userName} joined the room`);
    },
    onUserLeft: (data) => {
      console.log(`${data.userName} left the room`);
    },
    onUserTyping: (data) => {
      console.log(`${data.userName} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
    }
  });

  const handleSend = (text: string) => {
    sendMessage(text);
  };

  const handleSendDirect = (text: string, receiverName: string) => {
    sendMessage(text, receiverName); // Direct message
  };

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping);
  };

  // Build your custom UI
  return (
    <View>
      {/* Your custom chat UI */}
    </View>
  );
}
```

#### Using Chat Store

```typescript
import { useChatStore } from '@nightfuryequinn/rtc-made-simple-ui';

export default function ChatComponent() {
  const { 
    messages, 
    typingUsers, 
    connectedUsers,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages
  } = useChatStore();

  // Access chat state globally
  return (
    <View>
      <Text>Total messages: {messages.length}</Text>
      <Text>Online users: {Array.from(connectedUsers).join(', ')}</Text>
      <Text>Typing: {Array.from(typingUsers).join(', ')}</Text>
    </View>
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

### Video Call APIs

#### useVideoSocket

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

#### VideoCallScreen

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

#### CallOverlay

Component for incoming call overlay.

**Props:**
- `currentUser: string` - Current user identifier
- `onAccept: () => void` - Accept call callback
- `onDecline: () => void` - Decline call callback
- `onCancel: () => void` - Cancel call callback
- `avatarUrl?: string` - Caller avatar URL

### Chat APIs

#### useChatSocket

Hook for managing chat WebSocket connection.

**Parameters:**
- `userName: string` - Current user name
- `roomName: string` - Chat room name
- `baseUrl: string` - WebSocket server URL
- `onMessageReceived?: (message: ChatMessage) => void` - New message callback
- `onUserJoined?: (data: UserJoinedData) => void` - User joined callback
- `onUserLeft?: (data: UserLeftData) => void` - User left callback
- `onUserTyping?: (data: UserTypingData) => void` - Typing indicator callback
- `onMessageRead?: (data: MessageReadReceiptData) => void` - Message read callback
- `onMessageDeleted?: (data: MessageDeletedData) => void` - Message deleted callback
- `autoConnect?: boolean` - Auto-connect on mount (default: true)

**Returns:**
- `messages: ChatMessage[]` - Array of chat messages
- `typingUsers: string[]` - Array of users currently typing
- `connectedUsers: string[]` - Array of connected users
- `sendMessage: (message: string, receiverName?: string, metadata?: any) => void` - Send a message
- `joinRoom: (roomName: string) => void` - Join a different room
- `setTyping: (isTyping: boolean) => void` - Set typing status
- `markMessageAsRead: (messageId: string, senderName: string) => void` - Mark message as read
- `deleteMessage: (messageId: string) => void` - Delete a message

#### ChatWindow

Component for complete chat interface.

**Props:**
- `userName: string` - Current user name
- `roomName: string` - Chat room name
- `baseUrl: string` - WebSocket server URL
- `onMessageReceived?: (message: ChatMessage) => void` - New message callback
- `placeholder?: string` - Input placeholder text
- `emptyStateText?: string` - Empty state message
- `showTypingIndicator?: boolean` - Show typing indicators (default: true)

#### MessageItem

Component for rendering individual chat messages.

**Props:**
- `message: ChatMessage` - Message data
- `isOwnMessage: boolean` - Whether message is from current user
- `onLongPress?: (message: ChatMessage) => void` - Long press handler
- `showSenderName?: boolean` - Show sender name (default: true)

#### useChatStore

Zustand store for global chat state management.

**State:**
- `messages: ChatMessage[]` - All messages
- `typingUsers: Set<string>` - Users currently typing
- `connectedUsers: Set<string>` - Connected users
- `currentRoom: string | null` - Current room name
- `currentUser: string | null` - Current user name

**Actions:**
- `addMessage: (message: ChatMessage) => void`
- `updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void`
- `removeMessage: (messageId: string) => void`
- `setTypingUser: (userName: string, isTyping: boolean) => void`
- `addConnectedUser: (userName: string) => void`
- `removeConnectedUser: (userName: string) => void`
- `setCurrentRoom: (roomName: string) => void`
- `setCurrentUser: (userName: string) => void`
- `clearMessages: () => void`
- `reset: () => void`

## TypeScript Support

All components and hooks are fully typed. Import types as needed:

```typescript
import type {
  // Video Call Types
  IncomingCallData,
  CallDeclinedData,
  CallAcceptedData,
  CallEndedData,
  VideoCallConfig,
  
  // Chat Types
  ChatMessage,
  UserJoinedData,
  UserLeftData,
  UserTypingData,
  MessageReadReceiptData,
  MessageDeletedData,
  ChatConfig
} from '@nightfuryequinn/rtc-made-simple-ui';
```