# RTC-Made-Simple

A WebRTC video calling and real-time chat toolkit for React Native and NestJS. The packages provide signaling, UI hooks/components, and callback hooks so host apps can add auth, persistence, and business logic.

## Features

- WebRTC video calling with Socket.IO signaling
- Real-time chat with typing indicators, read receipts, delete, and history hooks
- Room-based communication
- Call overlay and video call screen for React Native
- TypeScript support
- Extensible NestJS modules via `forRoot({ callbacks })`

## Packages

### [@nightfuryequinn/rtc-made-simple-server](./RTC-Made-Simple-Server)
NestJS server module for video calling and chat signaling.

```bash
npm install @nightfuryequinn/rtc-made-simple-server
```

Peer dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `class-validator`, `class-transformer`.

```typescript
import { VideoCallModule, ChatModule } from '@nightfuryequinn/rtc-made-simple-server';

@Module({
  imports: [
    VideoCallModule.forRoot({
      callbacks: {
        canConnect: async (callerName) => Boolean(callerName),
        onCallCreated: async (caller, receiver, conversationId) => {},
        onCallEnded: async (caller, receiver, status) => {}
      }
    }),
    ChatModule.forRoot({
      callbacks: {
        onMessageSent: async (sender, receiver, message, room, metadata) => {
          // Return { messageId } to control IDs used by clients
        },
        onGetMessages: async (roomName, limit) => []
      }
    })
  ]
})
export class AppModule {}
```

[Full server docs](./RTC-Made-Simple-Server/README.md)

### [@nightfuryequinn/rtc-made-simple-ui](./RTC-Made-Simple-UI)
React Native components and hooks for video calling and chat.

```bash
npm install @nightfuryequinn/rtc-made-simple-ui
npm install socket.io-client react-native-webrtc react-native-incall-manager zustand
```

```typescript
import { useVideoSocket, ChatWindow, CallOverlay } from '@nightfuryequinn/rtc-made-simple-ui';

const { initiateCall, acceptCall, declineCall } = useVideoSocket({
  currentUser: 'user123',
  baseUrl: 'http://your-server.com'
});

<ChatWindow
  userName="user123"
  roomName="general"
  baseUrl="http://your-server.com"
/>
```

[Full UI docs](./RTC-Made-Simple-UI/README.md)

## Example Application

The [`RTC-Made-Simple-Example`](./RTC-Made-Simple-Example) folder contains:

- **Backend (NestJS):** ValidationPipe, in-memory chat history, Swagger
- **Mobile (Expo):** Video call + chat demo

### Local development setup

Build the libraries first (examples depend on the local package directories):

```bash
cd RTC-Made-Simple-Server && npm install && npm run build
cd ../RTC-Made-Simple-UI && npm install && npm run build
```

Start the backend:

```bash
cd RTC-Made-Simple-Example/example-backend
npm install
npm run dev
```

Start the mobile app:

```bash
cd RTC-Made-Simple-Example/example-mobile
npm install
npm start
```

### Emulator vs physical device

| Environment | Default server URL |
|-------------|--------------------|
| iOS simulator | `http://localhost:3000` |
| Android emulator | `http://10.0.2.2:3000` |
| Physical device | Set `EXPO_PUBLIC_RTC_SERVER_URL=http://YOUR_LAN_IP:3000` |

Use two devices/emulators with different device names. Enter the other device's displayed name as the call target.

## Event flows

### Chat

1. Client connects to `/chat` with `userName` + `roomName`
2. `sendMessage` includes optional `clientMessageId`
3. Server persists via callback, emits `newMessage` to room peers and `messageAck` to sender
4. Clients reconcile optimistic IDs; `getMessages` / `messageHistory` load history
5. `messageRead`, `deleteMessage`, and `typing` fan out to the room

### Video call

1. Clients connect to `/call` and stay in a home room named after themselves
2. Caller joins the receiver room, emits `incomingCall`
3. Receiver accepts then both open `VideoCallScreen`, join the receiver room, emit `peerReady`
4. Caller sends WebRTC offer (`newCall`), receiver answers (`callAnswered`), ICE via `ICEcandidate`
5. Hang up / decline / cancel / disconnect returns peers home and invokes `onCallEnded`

## Security notes

This toolkit is **signaling-only**. It does not ship authentication, authorization, or durable storage.

1. Implement `canConnect` (and preferably token-based handshake auth) before production
2. Add rate limiting and content moderation for chat
3. Use TURN servers for reliable NAT traversal
4. Serve over HTTPS/WSS in production
5. Treat `callerName` / `userName` query params as untrusted unless verified

## Architecture

```
Client (rtc-made-simple-ui)
  useVideoSocket / VideoCallScreen / ChatWindow
        | Socket.IO
Server (rtc-made-simple-server)
  VideoCallGateway (/call)   ChatGateway (/chat)
  VideoCallService           ChatService
        | callbacks                  | callbacks
  Host app persistence / auth / notifications
```

## License

MIT
