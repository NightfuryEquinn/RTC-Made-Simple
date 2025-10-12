import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";

@WebSocketGateway({
  cors: true,
  transports: ['websocket'],
  path: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService
  ) {}

  @WebSocketServer() server!: Server

  handleConnection(client: Socket) {
    const userName = client.handshake.query.userName as string
    const roomName = client.handshake.query.roomName as string

    if (!userName) {
      client.disconnect()
      console.log('User name is required. Disconnected ...')
      return
    }

    client.data.user = userName
    client.data.roomName = roomName
    client.join(roomName)

    console.log(`User ${userName} connected to chat room ${roomName}`)

    // Notify others in the room
    client.to(roomName).emit('userJoined', {
      userName: userName,
      roomName: roomName,
      timestamp: new Date().toISOString()
    })
  }

  handleDisconnect(client: Socket) {
    if (client.data.user && client.data.roomName) {
      console.log(`User ${client.data.user} disconnected from chat room ${client.data.roomName}`)
      
      // Notify others in the room
      client.to(client.data.roomName).emit('userLeft', {
        userName: client.data.user,
        roomName: client.data.roomName,
        timestamp: new Date().toISOString()
      })
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomName: string },
    @ConnectedSocket() client: Socket
  ) {
    const target = data.roomName
    if (!target) {
      console.log('Target room name is required.')
      return
    }

    // Leave current room
    if (client.data.roomName && client.data.roomName !== target) {
      client.leave(client.data.roomName)
      client.to(client.data.roomName).emit('userLeft', {
        userName: client.data.user,
        roomName: client.data.roomName,
        timestamp: new Date().toISOString()
      })
    }

    // Join new room
    client.join(target)
    client.data.roomName = target

    console.log(`User ${client.data.user} joined chat room ${target}`)

    // Notify others in the new room
    client.to(target).emit('userJoined', {
      userName: client.data.user,
      roomName: target,
      timestamp: new Date().toISOString()
    })
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { 
      message: string, 
      receiverName?: string,
      metadata?: any 
    },
    @ConnectedSocket() client: Socket
  ) {
    const messageData = {
      senderName: client.data.user,
      receiverName: data.receiverName,
      message: data.message,
      roomName: client.data.roomName,
      metadata: data.metadata,
      timestamp: new Date().toISOString()
    }

    console.log(`Message from ${client.data.user} in room ${client.data.roomName}`)

    // If receiver is specified, send to specific user, otherwise broadcast to room
    if (data.receiverName) {
      client.to(client.data.roomName).emit('newMessage', messageData)
    } else {
      client.to(client.data.roomName).emit('newMessage', messageData)
    }

    // Save message via service
    try {
      await this.chatService.saveMessage(
        client.data.user,
        data.receiverName || null,
        data.message,
        client.data.roomName,
        data.metadata
      )
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { isTyping: boolean },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`User ${client.data.user} is ${data.isTyping ? 'typing' : 'stopped typing'}`)

    client.to(client.data.roomName).emit('userTyping', {
      userName: client.data.user,
      roomName: client.data.roomName,
      isTyping: data.isTyping,
      timestamp: new Date().toISOString()
    })
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @MessageBody() data: { 
      messageId: string,
      senderName: string 
    },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Message ${data.messageId} read by ${client.data.user}`)

    client.to(client.data.roomName).emit('messageReadReceipt', {
      messageId: data.messageId,
      readBy: client.data.user,
      timestamp: new Date().toISOString()
    })

    try {
      await this.chatService.markMessageAsRead(
        data.messageId,
        client.data.user
      )
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Message ${data.messageId} deleted by ${client.data.user}`)

    client.to(client.data.roomName).emit('messageDeleted', {
      messageId: data.messageId,
      deletedBy: client.data.user,
      roomName: client.data.roomName,
      timestamp: new Date().toISOString()
    })

    try {
      await this.chatService.deleteMessage(data.messageId, client.data.user)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }
}
