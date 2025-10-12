# RTC-Made-Simple-Server

WebSocket-based video calling and chat server for NestJS applications with WebRTC support.

## Installation

```bash
npm install @nightfuryequinn/rtc-made-simple-server
```

## Features

- ✅ WebRTC-based video calling
- ✅ Real-time chat messaging
- ✅ Room-based communication
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message deletion
- ✅ Customizable business logic through callbacks
- ✅ Full TypeScript support

## Usage

### Video Call Module

#### Basic Setup

```typescript
import { VideoCallModule } from '@nightfuryequinn/rtc-made-simple-server'

@Module({
  imports: [
    VideoCallModule.forRoot() // Basic setup
  ]
})
export class AppModule {}
```

Done! Simple! You are good to go!

#### Advanced Setup with Custom Callbacks

```typescript
import { VideoCallModule, VideoCallCallbacks, CallStatus } from '@nightfuryequinn/rtc-made-simple-server';

const callbacks: VideoCallCallbacks = {
  onCallCreated: async (callerName: string, receiverName: string) => {
    // Your custom logic for call creation
    console.log(`Call created from ${callerName} to ${receiverName}`);
    // e.g., save to database, send notifications, etc.
  },
  onCallEnded: async (callerName: string, receiverName: string, status: CallStatus) => {
    // Your custom logic for call end
    console.log(`Call ended: ${callerName} -> ${receiverName}, status: ${status}`);
    // e.g., update database, etc.
  },
};

@Module({
  imports: [
    VideoCallModule.forRoot({ callbacks }),
  ],
})
export class AppModule {}
```

#### Advanced Setup with Custom Service Implementation

```typescript
import { Injectable } from '@nestjs/common';
import { VideoCallServiceInterface, CallStatus, ResponseCallDto } from '@nightfuryequinn/rtc-made-simple-server';

@Injectable()
export class CustomVideoCallService implements VideoCallServiceInterface {
  async createCall(callerName: string, receiverName: string): Promise<ResponseCallDto> {
    // Your custom implementation
    // e.g., database operations, user validation, etc.
    return new ResponseCallDto({
      callId: 'your-generated-id',
      callerId: callerName,
      receiverId: receiverName
    });
  }

  async endCall(callerName: string, receiverName: string, status: CallStatus): Promise<any> {
    // Your custom implementation
    return { message: 'Call ended successfully' };
  }
}

@Module({
  imports: [
    VideoCallModule.forRoot({ 
      customService: CustomVideoCallService 
    }),
  ],
})
export class AppModule {}
```

### Chat Module

#### Basic Setup

```typescript
import { ChatModule } from '@nightfuryequinn/rtc-made-simple-server'

@Module({
  imports: [
    ChatModule.forRoot() // Basic setup
  ]
})
export class AppModule {}
```

#### Advanced Setup with Custom Callbacks

```typescript
import { ChatModule, ChatCallbacks } from '@nightfuryequinn/rtc-made-simple-server';

const chatCallbacks: ChatCallbacks = {
  onMessageSent: async (senderName, receiverName, message, roomName, metadata) => {
    // Your custom logic for message sent
    console.log(`Message from ${senderName} in ${roomName}: ${message}`);
    // e.g., save to database, moderate content, send push notifications
  },
  onMessageRead: async (messageId, readBy) => {
    // Your custom logic for message read
    console.log(`Message ${messageId} read by ${readBy}`);
    // e.g., update read status in database
  },
  onMessageDeleted: async (messageId, deletedBy) => {
    // Your custom logic for message deletion
    console.log(`Message ${messageId} deleted by ${deletedBy}`);
    // e.g., soft delete in database
  },
  onGetMessages: async (roomName, limit) => {
    // Your custom logic to fetch messages
    console.log(`Fetching messages for room ${roomName}, limit: ${limit}`);
    // e.g., fetch from database
    return []; // Return array of MessageResponseDto
  }
};

@Module({
  imports: [
    ChatModule.forRoot({ callbacks: chatCallbacks }),
  ],
})
export class AppModule {}
```

#### Custom Service Implementation

```typescript
import { Injectable } from '@nestjs/common';
import { ChatServiceInterface, MessageResponseDto } from '@nightfuryequinn/rtc-made-simple-server';

@Injectable()
export class CustomChatService implements ChatServiceInterface {
  async saveMessage(
    senderName: string,
    receiverName: string | null | undefined,
    message: string,
    roomName: string,
    metadata?: any
  ): Promise<MessageResponseDto> {
    // Your custom implementation
    // e.g., save to database, validate message, etc.
    return new MessageResponseDto({
      messageId: 'your-generated-id',
      senderName,
      receiverName,
      message,
      roomName,
      timestamp: new Date().toISOString(),
      metadata
    });
  }

  async markMessageAsRead(messageId: string, readBy: string): Promise<any> {
    // Your custom implementation
    return { message: 'Message marked as read' };
  }

  async deleteMessage(messageId: string, deletedBy: string): Promise<any> {
    // Your custom implementation
    return { message: 'Message deleted successfully' };
  }

  async getMessages(roomName: string, limit?: number): Promise<MessageResponseDto[]> {
    // Your custom implementation
    return [];
  }
}

@Module({
  imports: [
    ChatModule.forRoot({ 
      customService: CustomChatService 
    }),
  ],
})
export class AppModule {}
```

### Combined Setup (Video Call + Chat)

```typescript
import { VideoCallModule, ChatModule } from '@nightfuryequinn/rtc-made-simple-server';

@Module({
  imports: [
    VideoCallModule.forRoot({
      callbacks: {
        onCallCreated: async (callerName, receiverName) => {
          console.log(`Call created: ${callerName} → ${receiverName}`);
        },
        onCallEnded: async (callerName, receiverName, status) => {
          console.log(`Call ended: ${callerName} → ${receiverName}, status: ${status}`);
        },
      }
    }),
    ChatModule.forRoot({
      callbacks: {
        onMessageSent: async (senderName, receiverName, message, roomName, metadata) => {
          console.log(`Message from ${senderName} in ${roomName}: ${message}`);
        },
        onMessageRead: async (messageId, readBy) => {
          console.log(`Message ${messageId} read by ${readBy}`);
        },
        onMessageDeleted: async (messageId, deletedBy) => {
          console.log(`Message ${messageId} deleted by ${deletedBy}`);
        },
      }
    })
  ]
})
export class AppModule {}
```

## WebSocket Events

### Video Call Events

The video call gateway handles the following WebSocket events on path `/call`:

- `joinCallRoom` - Join a specific call room
- `newCall` - Initiate a new call
- `incomingCall` - Handle incoming call notifications
- `acceptCall` - Accept incoming call
- `declineCall` - Decline incoming call
- `cancelCall` - Cancel outgoing call
- `endCall` - End active call
- `callAnswered` - Handle call answer with WebRTC data
- `ICEcandidate` - Exchange ICE candidates for WebRTC

### Chat Events

The chat gateway handles the following WebSocket events on path `/chat`:

- `joinRoom` - Join a chat room
- `sendMessage` - Send a message to the room
- `typing` - Send typing indicator
- `messageRead` - Mark message as read
- `deleteMessage` - Delete a message
- `newMessage` - Receive new messages (emitted by server)
- `userJoined` - User joined notification (emitted by server)
- `userLeft` - User left notification (emitted by server)
- `userTyping` - Typing indicator (emitted by server)
- `messageReadReceipt` - Message read confirmation (emitted by server)
- `messageDeleted` - Message deletion notification (emitted by server)

## REST API Endpoints

### Video Call Endpoints

- `POST /video-call/create-call` - Create a new call
- `POST /video-call/end-call` - End a call

### Chat Endpoints

- `POST /chat/send-message` - Send a message
- `GET /chat/messages?roomName=<room>&limit=<number>` - Get messages for a room

## Configurations

### Video Call Gateway
- Path: `/call`
- CORS: Enabled by default
- Transport: WebSocket
- Automatic room management for call participants

### Chat Gateway
- Path: `/chat`
- CORS: Enabled by default
- Transport: WebSocket
- Room-based message broadcasting

## TypeScript Support

All modules, services, and DTOs are fully typed. Import types as needed:

```typescript
import { 
  // Video Call Types
  CallStatus,
  CreateCallDto,
  ResponseCallDto,
  EndCallDto,
  VideoCallCallbacks,
  VideoCallServiceInterface,
  
  // Chat Types
  SendMessageDto,
  MessageResponseDto,
  ChatCallbacks,
  ChatServiceInterface
} from '@nightfuryequinn/rtc-made-simple-server';
```