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
import { ChatService } from "./chat.service";

@WebSocketGateway({
  cors: true,
  transports: ['websocket'],
  path: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService
  ) {}

  @WebSocketServer() server!: Server;

  async handleConnection(client: Socket) {
    const userName = client.handshake.query.userName as string;
    const roomName = (client.handshake.query.roomName as string) || undefined;

    if (!userName) {
      this.logger.warn('User name is required. Disconnecting client.');
      client.emit('error', { message: 'userName is required' });
      client.disconnect();
      return;
    }

    const allowed = await this.chatService.canConnect(
      userName,
      roomName,
      client.handshake.query as Record<string, unknown>
    );

    if (!allowed) {
      this.logger.warn(`Connection rejected for user ${userName}`);
      client.emit('error', { message: 'Connection rejected' });
      client.disconnect();
      return;
    }

    client.data.user = userName;
    client.data.roomName = roomName;

    if (roomName) {
      client.join(roomName);
      client.to(roomName).emit('userJoined', {
        userName,
        roomName,
        timestamp: new Date().toISOString()
      });
    }

    this.logger.log(`User ${userName} connected to chat room ${roomName ?? '(none)'}`);
  }

  handleDisconnect(client: Socket) {
    if (client.data.user && client.data.roomName) {
      this.logger.log(
        `User ${client.data.user} disconnected from chat room ${client.data.roomName}`
      );

      client.to(client.data.roomName).emit('userLeft', {
        userName: client.data.user,
        roomName: client.data.roomName,
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomName: string },
    @ConnectedSocket() client: Socket
  ) {
    const target = data?.roomName;
    if (!target) {
      client.emit('error', { message: 'Target room name is required' });
      return { ok: false, error: 'Target room name is required' };
    }

    if (client.data.roomName && client.data.roomName !== target) {
      const previousRoom = client.data.roomName;
      client.leave(previousRoom);
      client.to(previousRoom).emit('userLeft', {
        userName: client.data.user,
        roomName: previousRoom,
        timestamp: new Date().toISOString()
      });
    }

    client.join(target);
    client.data.roomName = target;

    this.logger.log(`User ${client.data.user} joined chat room ${target}`);

    client.to(target).emit('userJoined', {
      userName: client.data.user,
      roomName: target,
      timestamp: new Date().toISOString()
    });

    return { ok: true, roomName: target };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: {
      message: string;
      receiverName?: string;
      metadata?: any;
      clientMessageId?: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    if (!client.data.roomName) {
      client.emit('error', { message: 'Join a room before sending messages' });
      return { ok: false, error: 'Join a room before sending messages' };
    }

    if (!data?.message?.trim()) {
      client.emit('error', { message: 'Message is required' });
      return { ok: false, error: 'Message is required' };
    }

    try {
      const saved = await this.chatService.saveMessage(
        client.data.user,
        data.receiverName || null,
        data.message.trim(),
        client.data.roomName,
        data.metadata
      );

      const messageData = {
        messageId: saved.messageId,
        senderName: saved.senderName,
        receiverName: saved.receiverName,
        message: saved.message,
        roomName: saved.roomName,
        metadata: saved.metadata,
        timestamp: saved.timestamp,
        clientMessageId: data.clientMessageId
      };

      this.logger.log(
        `Message ${saved.messageId} from ${client.data.user} in room ${client.data.roomName}`
      );

      client.to(client.data.roomName).emit('newMessage', messageData);
      client.emit('messageAck', messageData);

      return { ok: true, message: messageData };
    } catch (error) {
      this.logger.error('Error saving message', error);
      client.emit('error', { message: 'Failed to send message' });
      return { ok: false, error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @MessageBody() data: { roomName?: string; limit?: number },
    @ConnectedSocket() client: Socket
  ) {
    const roomName = data?.roomName || client.data.roomName;
    if (!roomName) {
      client.emit('error', { message: 'roomName is required' });
      return { ok: false, error: 'roomName is required' };
    }

    try {
      const messages = await this.chatService.getMessages(roomName, data?.limit);
      client.emit('messageHistory', {
        roomName,
        messages
      });
      return { ok: true, messages };
    } catch (error) {
      this.logger.error('Error fetching messages', error);
      client.emit('error', { message: 'Failed to fetch messages' });
      return { ok: false, error: 'Failed to fetch messages' };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { isTyping: boolean },
    @ConnectedSocket() client: Socket
  ) {
    if (!client.data.roomName) {
      return;
    }

    client.to(client.data.roomName).emit('userTyping', {
      userName: client.data.user,
      roomName: client.data.roomName,
      isTyping: Boolean(data?.isTyping),
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @MessageBody() data: {
      messageId: string;
      senderName: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    if (!data?.messageId || !client.data.roomName) {
      return;
    }

    this.logger.log(`Message ${data.messageId} read by ${client.data.user}`);

    client.to(client.data.roomName).emit('messageReadReceipt', {
      messageId: data.messageId,
      readBy: client.data.user,
      timestamp: new Date().toISOString()
    });

    try {
      await this.chatService.markMessageAsRead(data.messageId, client.data.user);
    } catch (error) {
      this.logger.error('Error marking message as read', error);
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (!data?.messageId || !client.data.roomName) {
      return;
    }

    this.logger.log(`Message ${data.messageId} deleted by ${client.data.user}`);

    client.to(client.data.roomName).emit('messageDeleted', {
      messageId: data.messageId,
      deletedBy: client.data.user,
      roomName: client.data.roomName,
      timestamp: new Date().toISOString()
    });

    try {
      await this.chatService.deleteMessage(data.messageId, client.data.user);
    } catch (error) {
      this.logger.error('Error deleting message', error);
    }
  }
}
