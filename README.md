# RTC-Made-Simple

A complete, production-ready WebRTC video calling and real-time chat solution for React Native and NestJS applications. Built with simplicity and extensibility in mind.

## 🚀 Features

- ✅ **WebRTC Video Calling** - High-quality peer-to-peer video calls
- ✅ **Real-time Chat** - Instant messaging with typing indicators
- ✅ **Room-based Communication** - Multiple chat rooms and call sessions
- ✅ **Read Receipts** - Track message read status
- ✅ **Message Management** - Delete messages, mark as read
- ✅ **Call Overlay** - Beautiful incoming call UI
- ✅ **TypeScript Support** - Full type safety
- ✅ **Customizable** - Extend with your own business logic
- ✅ **Production Ready** - Battle-tested architecture

## 📦 Packages

This monorepo contains two main packages that work together:

### [@nightfuryequinn/rtc-made-simple-server](./RTC-Made-Simple-Server)
NestJS server module for video calling and chat functionality.

**Installation:**
```bash
npm install @nightfuryequinn/rtc-made-simple-server
```

**Quick Start:**
```typescript
import { VideoCallModule, ChatModule } from '@nightfuryequinn/rtc-made-simple-server';

@Module({
  imports: [
    VideoCallModule.forRoot(),
    ChatModule.forRoot()
  ]
})
export class AppModule {}
```

[📖 Full Documentation](./RTC-Made-Simple-Server/README.md)

### [@nightfuryequinn/rtc-made-simple-ui](./RTC-Made-Simple-UI)
React Native components and hooks for video calling and chat interfaces.

**Installation:**
```bash
npm install @nightfuryequinn/rtc-made-simple-ui
```

**Peer Dependencies:**
```bash
npm install socket.io-client react-native-webrtc react-native-incall-manager zustand
```

**Quick Start:**
```typescript
import { useVideoSocket, ChatWindow, CallOverlay } from '@nightfuryequinn/rtc-made-simple-ui';

// Video call
const { initiateCall, acceptCall, declineCall } = useVideoSocket({
  currentUser: 'user123',
  baseUrl: 'http://your-server.com'
});

// Chat
<ChatWindow
  userName="user123"
  roomName="general"
  baseUrl="http://your-server.com"
/>
```

[📖 Full Documentation](./RTC-Made-Simple-UI/README.md)

## 🎯 Example Application

Check out the complete React Native + NestJS example application in the [`RTC-Made-Simple-Example`](./RTC-Made-Simple-Example) directory.

The example includes:
- **Backend (NestJS)**: Video call and chat server setup
- **Mobile (React Native + Expo)**: Complete mobile app with video calling and chat

### Running the Example

1. **Start the Backend:**
```bash
cd RTC-Made-Simple-Example/example-backend
npm install
npm run dev
```

2. **Start the Mobile App:**
```bash
cd RTC-Made-Simple-Example/example-mobile
npm install
npm start
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Video Call UI   │         │    Chat UI       │         │
│  │  - CallOverlay   │         │  - ChatWindow    │         │
│  │  - VideoCallScreen│        │  - MessageItem   │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                             │                    │
│           └──────────┬──────────────────┘                    │
│                      │                                       │
│              @nightfuryequinn/                              │
│           rtc-made-simple-ui                                │
└──────────────────────┼──────────────────────────────────────┘
                       │ WebSocket + WebRTC
                       │
┌──────────────────────┼──────────────────────────────────────┐
│              @nightfuryequinn/                              │
│           rtc-made-simple-server                            │
│                      │                                       │
│      ┌───────────────┴────────────────┐                    │
│      │                                 │                    │
│  ┌───┴────────────┐        ┌──────────┴─────┐            │
│  │ VideoCall      │        │  Chat          │             │
│  │ Gateway        │        │  Gateway       │             │
│  │ - /call        │        │  - /chat       │             │
│  │ - WebRTC       │        │  - Messages    │             │
│  │ - Signaling    │        │  - Typing      │             │
│  └────────────────┘        └────────────────┘             │
│                                                              │
│                    NestJS Server                            │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Server
- **NestJS** - Progressive Node.js framework
- **Socket.IO** - Real-time bidirectional communication
- **WebRTC** - Peer-to-peer video calling
- **TypeScript** - Type-safe development

### Client
- **React Native** - Cross-platform mobile development
- **Expo** - React Native toolchain
- **react-native-webrtc** - WebRTC for React Native
- **Zustand** - State management
- **TypeScript** - Type-safe development

## 📱 Platform Support

- ✅ iOS
- ✅ Android
- ✅ Web (with modifications)

## 🔧 Configuration

### Video Call Configuration

**Server Side:**
```typescript
VideoCallModule.forRoot({
  callbacks: {
    onCallCreated: async (callerName, receiverName) => {
      // Save to database, send push notification
    },
    onCallEnded: async (callerName, receiverName, status) => {
      // Update call history
    }
  }
})
```

**Client Side:**
```typescript
<VideoCallScreen
  iceServers={[
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
  ]}
/>
```

### Chat Configuration

**Server Side:**
```typescript
ChatModule.forRoot({
  callbacks: {
    onMessageSent: async (sender, receiver, message, room, metadata) => {
      // Save to database, moderate content
    },
    onMessageRead: async (messageId, readBy) => {
      // Update read receipts
    }
  }
})
```

## 🔐 Security Considerations

1. **Authentication**: Implement proper user authentication before allowing connections
2. **Rate Limiting**: Add rate limiting to prevent spam
3. **Content Moderation**: Implement message filtering for chat
4. **TURN Servers**: Use TURN servers for NAT traversal in production
5. **SSL/TLS**: Always use HTTPS/WSS in production

## 🚨 Troubleshooting

### Common Issues

#### 1. Babel Configuration
Ensure your `babel.config.js` includes proper presets:
```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // Add any required plugins
  ]
};
```

#### 2. Android Permissions
Add required permissions to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

#### 3. iOS Permissions
Add to `ios/YourApp/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone for video calls</string>
```

#### 4. Dependency Versions
Ensure compatible versions:
```json
{
  "socket.io-client": "^4.8.1",
  "react-native-webrtc": "^124.0.6",
  "react-native-incall-manager": "^4.2.1",
  "zustand": "^5.0.8"
}
```

#### 5. Android Remote Stream Issues
If Android devices crash when remote stream is established:
- Check WebRTC permissions
- Ensure proper camera/microphone release
- Update to latest `react-native-webrtc` version
- Test on physical devices, not just emulators

## 📚 API Documentation

- [Server API Documentation](./RTC-Made-Simple-Server/README.md)
- [UI Components Documentation](./RTC-Made-Simple-UI/README.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🔗 Links

- [GitHub Repository](https://github.com/NightfuryEquinn/RTC-Made-Simple)
- [Example Application](./RTC-Made-Simple-Example)
- [Issues & Support](https://github.com/NightfuryEquinn/RTC-Made-Simple/issues)

## 🙏 Acknowledgments

Built with ❤️ using:
- [NestJS](https://nestjs.com/)
- [React Native](https://reactnative.dev/)
- [Socket.IO](https://socket.io/)
- [WebRTC](https://webrtc.org/)

---

**Made with ❤️ by NightfuryEquinn**