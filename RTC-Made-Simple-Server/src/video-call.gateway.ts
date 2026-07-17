import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { VideoCallService } from "./video-call.service";
import { CallStatus } from "./dtos/end-call.dto";

@WebSocketGateway({
  cors: true,
  transports: ['websocket'],
  path: '/call'
})
export class VideoCallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(VideoCallGateway.name);

  constructor(
    private readonly videoCallService: VideoCallService
  ) {}

  @WebSocketServer() server!: Server;

  async handleConnection(client: Socket) {
    const callerName = client.handshake.query.callerName as string;
    const roomName = (client.handshake.query.roomName as string) || callerName;

    if (!callerName) {
      this.logger.warn('Caller name is required. Disconnecting client.');
      client.emit('error', { message: 'callerName is required' });
      client.disconnect();
      return;
    }

    const allowed = await this.videoCallService.canConnect(
      callerName,
      roomName,
      client.handshake.query as Record<string, unknown>
    );

    if (!allowed) {
      this.logger.warn(`Connection rejected for caller ${callerName}`);
      client.emit('error', { message: 'Connection rejected' });
      client.disconnect();
      return;
    }

    client.data.user = callerName;
    client.data.homeRoom = roomName;
    client.data.roomName = roomName;
    client.data.activeCall = null;
    client.join(roomName);

    this.logger.log(`Caller ${callerName} connected to room ${client.data.roomName}`);
  }

  async handleDisconnect(client: Socket) {
    if (client.data.user && client.data.roomName) {
      this.logger.log(
        `User ${client.data.user} disconnected from room ${client.data.roomName}`
      );
    }

    const activeCall = client.data.activeCall as {
      callerName: string;
      receiverName: string;
      conversationId?: number;
    } | null;

    if (activeCall) {
      const room = activeCall.receiverName;
      client.to(room).emit('callEnded', {
        callerName: activeCall.callerName,
        receiverName: activeCall.receiverName,
        conversationId: activeCall.conversationId,
        endedBy: client.data.user,
        reason: 'Peer disconnected'
      });

      try {
        await this.videoCallService.endCall(
          activeCall.callerName,
          activeCall.receiverName,
          CallStatus.ENDED
        );
      } catch (error) {
        this.logger.error('Error ending call on disconnect', error);
      }
    }
  }

  private returnToHomeRoom(client: Socket) {
    if (client.data.roomName && client.data.roomName !== client.data.homeRoom) {
      client.leave(client.data.roomName);
    }
    client.join(client.data.homeRoom);
    client.data.roomName = client.data.homeRoom;
    client.data.activeCall = null;
  }

  @SubscribeMessage('joinCallRoom')
  async handleJoinCallRoom(
    @MessageBody() data: { roomName: string },
    @ConnectedSocket() client: Socket
  ) {
    const target = data?.roomName;
    if (!target) {
      client.emit('error', { message: 'Target room name is required' });
      return { ok: false, error: 'Target room name is required' };
    }

    if (client.data.roomName && client.data.roomName !== target) {
      client.leave(client.data.roomName);
    }

    client.join(target);
    client.data.roomName = target;

    this.logger.log(`User ${client.data.user} joined call room ${target}`);

    client.to(target).emit('peerJoined', {
      userName: client.data.user,
      roomName: target
    });

    return { ok: true, roomName: target };
  }

  @SubscribeMessage('peerReady')
  async handlePeerReady(
    @MessageBody() data: { roomName: string; callerName: string; receiverName: string },
    @ConnectedSocket() client: Socket
  ) {
    const room = data?.roomName || client.data.roomName;
    if (!room) {
      return { ok: false, error: 'roomName is required' };
    }

    client.to(room).emit('peerReady', {
      userName: client.data.user,
      callerName: data.callerName,
      receiverName: data.receiverName,
      roomName: room
    });

    return { ok: true };
  }

  @SubscribeMessage('newCall')
  async handleNewCall(
    @MessageBody() data: { receiverName: string; rtcMessage: any },
    @ConnectedSocket() client: Socket
  ) {
    if (!client.data.roomName) {
      return;
    }

    this.logger.log(
      `Offer from ${client.data.user} to ${data.receiverName} in room ${client.data.roomName}`
    );

    client.to(client.data.roomName).emit('newCall', {
      callerName: client.data.user,
      receiverName: data.receiverName,
      rtcMessage: data.rtcMessage
    });
  }

  @SubscribeMessage('endCall')
  async handleEndCall(
    @MessageBody() data: {
      callerName: string;
      receiverName: string;
      conversationId?: number;
    },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`Call ended by ${client.data.user} in room ${client.data.roomName}`);

    client.to(client.data.roomName).emit('callEnded', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      conversationId: data.conversationId,
      endedBy: client.data.user
    });

    this.returnToHomeRoom(client);
    this.logger.log(`User ${client.data.user} returned to home room ${client.data.roomName}`);

    try {
      await this.videoCallService.endCall(
        data.callerName,
        data.receiverName,
        CallStatus.ENDED
      );
    } catch (error) {
      this.logger.error('Error ending call', error);
    }
  }

  @SubscribeMessage('incomingCall')
  async handleIncomingCall(
    @MessageBody() data: {
      receiverName: string;
      callerName: string;
      conversationId: number;
    },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(
      `Incoming call from ${data.callerName} to ${data.receiverName} in room ${client.data.roomName}`
    );

    client.data.activeCall = {
      callerName: data.callerName,
      receiverName: data.receiverName,
      conversationId: data.conversationId
    };

    client.to(client.data.roomName).emit('incomingCall', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      conversationId: data.conversationId,
      roomName: client.data.roomName
    });

    try {
      await this.videoCallService.createCall(
        data.callerName,
        data.receiverName,
        data.conversationId
      );
    } catch (error) {
      this.logger.error('Error creating call', error);
    }
  }

  @SubscribeMessage('acceptCall')
  async handleAcceptCall(
    @MessageBody() data: {
      callerName: string;
      receiverName: string;
      conversationId: number;
    },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`Call accepted by ${data.receiverName} from ${data.callerName}`);

    client.data.activeCall = {
      callerName: data.callerName,
      receiverName: data.receiverName,
      conversationId: data.conversationId
    };

    client.to(client.data.roomName).emit('callAccepted', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      conversationId: data.conversationId,
      roomName: client.data.roomName
    });
  }

  @SubscribeMessage('declineCall')
  async handleDeclineCall(
    @MessageBody() data: {
      callerName: string;
      receiverName: string;
      reason?: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`Call declined by ${data.receiverName} for ${data.callerName}`);

    const targetRoom = client.data.roomName;

    client.to(targetRoom).emit('callDeclined', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      reason: data.reason || 'Call declined'
    });

    this.returnToHomeRoom(client);
    this.logger.log(`User ${client.data.user} returned to home room ${client.data.roomName}`);

    try {
      await this.videoCallService.endCall(
        data.callerName,
        data.receiverName,
        CallStatus.REJECTED
      );
    } catch (error) {
      this.logger.error('Error declining call', error);
    }
  }

  @SubscribeMessage('cancelCall')
  async handleCancelCall(
    @MessageBody() data: {
      callerName: string;
      receiverName: string;
      conversationId?: number;
    },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`Call cancelled by ${data.callerName} to ${data.receiverName}`);

    const targetRoom = client.data.roomName;

    client.to(targetRoom).emit('callEnded', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      conversationId: data.conversationId,
      endedBy: client.data.user,
      reason: 'Call cancelled'
    });

    this.returnToHomeRoom(client);
    this.logger.log(`User ${client.data.user} returned to home room ${client.data.roomName}`);

    try {
      await this.videoCallService.endCall(
        data.callerName,
        data.receiverName,
        CallStatus.ENDED
      );
    } catch (error) {
      this.logger.error('Error cancelling call', error);
    }
  }

  @SubscribeMessage('callAnswered')
  async handleCallAnswered(
    @MessageBody() data: {
      callerName: string;
      receiverName: string;
      rtcMessage: any;
    },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(
      `Answer from ${client.data.user} for ${data.callerName} in room ${client.data.roomName}`
    );

    client.to(client.data.roomName).emit('callAnswered', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      rtcMessage: data.rtcMessage
    });
  }

  @SubscribeMessage('ICEcandidate')
  async handleICEcandidate(
    @MessageBody() data: {
      callerName: string;
      receiverName: string;
      rtcMessage: any;
    },
    @ConnectedSocket() client: Socket
  ) {
    client.to(client.data.roomName).emit('ICEcandidate', {
      sender: client.data.user,
      rtcMessage: data.rtcMessage
    });
  }
}
