# RTC-Made-Simple-Server

WebSocket-based video calling server for NestJS applications with WebRTc support.

## Installation

```bash
npm install @nightfuryequinn/rtc-made-simple-server
```

## Usage

### Basic Setup

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

### Advanced Setup with Custom Callbacks

```typescript
import { VideoCallModule, VideoCallCallbacks, CallStatus } from '@maidx/video-call-server';

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

### Advanced Setup with Custom Service Implementation

```typescript
import { Injectable } from '@nestjs/common';
import { VideoCallServiceInterface, CallStatus, ResponseCallDto } from '@maidx/video-call-server';

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

## WebSocket Events

The gateway handles the following WebSocket events, noted that the name need to be the same:

- `joinCallRoom` - Join a specific call room
- `newCall` - Initiate a new call
- `incomingCall` - Handle incoming call notifications
- `acceptCall` - Accept incoming call
- `declineCall` - Decline incoming call
- `cancelCall` - Cancel outgoing call
- `endCall` - End active call
- `callAnswered` - Handle call answer with WebRTC data
- `ICEcandidate` - Exchange ICE candidates for WebRTC

## Endpoints

- `POST /video-call/create-call` - Create a new call
- `POST /video-call/end-call` - End a call

## Configurations

The websocket gateway runs on path `/call` and supports CORS by default. The gateway automatically handles room management for call participants.

## Features

- WebRTC signaling through WebSocket
- Room-based call management
- Call status tracking (Pending, Accepted, Rejected, Ended)
- ICE candidate exchange
- Customizable business logic through callbacks
- Full TypeScript support