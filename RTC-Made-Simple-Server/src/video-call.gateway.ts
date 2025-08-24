import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { VideoCallService } from "./video-call.service";
import { CallStatus } from "./dtos/end-call.dto";

@WebSocketGateway({
  cors: true,
  transports: ['websocket'],
  path: '/call'
})
export class VideoCallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly videoCallService: VideoCallService
  ) {}

  @WebSocketServer() server!: Server

  handleConnection(client: Socket) {
    const callerName = client.handshake.query.callerName as string
    const roomName = client.handshake.query.roomName as string

    if (!callerName) {
      client.disconnect()
      console.log('Caller name is required. Disconnected ...')
      return
    }

    client.data.user = callerName
    client.data.homeRoom = roomName
    client.data.roomName = roomName
    client.join(roomName)

    console.log(`Caller ${callerName} connected to room ${client.data.roomName}`)
  }

  handleDisconnect(client: Socket) {
    if (client.data.user && client.data.roomName) {
      console.log(`User ${client.data.user} disconnected from room ${client.data.roomName}`)
    }
  }

  @SubscribeMessage('joinCallRoom')
  async handleJoinCallRoom(
    @MessageBody() data: { roomName: string },
    @ConnectedSocket() client: Socket
  ) {
    const target = data.roomName
    if (!target) {
      console.log('Target room name is required.')
      return
    }

    if (client.data.roomName && client.data.roomName !== target) {
      client.leave(client.data.roomName)
    }

    client.join(target)
    client.data.roomName = target

    console.log(`User ${client.data.user} switched back to room ${client.data.roomName}`)
  }

  @SubscribeMessage('newCall')
  async handleNewCall(
    @MessageBody() data: { receiverName: string, rtcMessage: any },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Call from ${client.data.user} to ${data.receiverName} in room ${client.data.roomName}`)

    client.to(client.data.roomName).emit('newCall', {
      callerName: client.data.user,
      receiverName: data.receiverName,
      rtcMessage: data.rtcMessage
    })
  }

  @SubscribeMessage('endCall')
  async handleEndCall(
    @MessageBody() data: { callerName: string, receiverName: string, conversationId: number },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Call ended by ${client.data.user} in room ${client.data.roomName}`)

    client.to(client.data.roomName).emit('callEnded', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      conversationId: data.conversationId,
      endedBy: client.data.user
    })

    client.leave(client.data.roomName)
    client.join(client.data.homeRoom)
    client.data.roomName = client.data.homeRoom

    console.log(`User ${client.data.user} returned to home room ${client.data.roomName}`)
  
    try {
      await this.videoCallService.endCall(
        data.callerName, data.receiverName, CallStatus.ACCEPTED
      )
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  @SubscribeMessage('incomingCall')
  async handleIncomingCall(
    @MessageBody() data: { receiverName: string, callerName: string, conversationId: number },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Incoming call from ${data.callerName} to ${data.receiverName} in room ${client.data.roomName}`)
    
    client.to(client.data.roomName).emit('incomingCall', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      conversationId: data.conversationId,
      roomName: client.data.roomName
    })

    try {
      await this.videoCallService.createCall(
        data.callerName, data.receiverName
      )
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  @SubscribeMessage('acceptCall')
  async handleAcceptCall(
    @MessageBody() data: { callerName: string, receiverName: string, conversationId: number },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Call accepted by ${data.receiverName} from ${data.callerName}`)
  
    client.to(client.data.roomName).emit('callAccepted', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      conversationId: data.conversationId,
      roomName: client.data.roomName
    })
  }

  @SubscribeMessage('declineCall')
  async handleDeclineCall(
    @MessageBody() data: { callerName: string, receiverName: string, reason?: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Call declined by ${data.callerName} to ${data.receiverName}`)

    const targetRoom = client.data.roomName

    client.to(targetRoom).emit('callDeclined', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      reason: data.reason || 'Call declined'
    })

    client.leave(targetRoom)
    client.join(client.data.homeRoom)
    client.data.roomName = client.data.homeRoom

    console.log(`User ${client.data.user} returned to home room ${client.data.roomName}`)
  
    try {
      await this.videoCallService.endCall(
        data.callerName, data.receiverName, CallStatus.REJECTED
      )
    } catch (error) {
      console.error('Error declining call:', error)
    }
  }

  @SubscribeMessage('cancelCall')
  async handleCancelCall(
    @MessageBody() data: { callerName: string, receiverName: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Call cancelled by ${data.callerName} to ${data.receiverName}`)

    const targetRoom = client.data.roomName

    client.to(targetRoom).emit('callEnded', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      reason: 'Call cancelled'
    })

    client.leave(targetRoom)
    client.join(client.data.homeRoom)
    client.data.roomName = client.data.homeRoom

    console.log(`User ${client.data.user} returned to home room ${client.data.roomName}`)
  
    try {
      await this.videoCallService.endCall(
        data.callerName, data.receiverName, CallStatus.ENDED
      )
    } catch (error) {
      console.error('Error cancelling call:', error)
    }
  }

  @SubscribeMessage('callAnswered')
  async handleCallAnswered(
    @MessageBody() data: { callerName: string, receiverName: string, rtcMessage: any },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Call answered by ${client.data.user} from ${data.callerName} in room ${client.data.roomName}`)
  
    client.to(client.data.roomName).emit('callAnswered', {
      callerName: data.callerName,
      receiverName: data.receiverName,
      rtcMessage: data.rtcMessage
    })
  }

  @SubscribeMessage('ICEcandidate')
  async handleICEcandidate(
    @MessageBody() data: { callerName: string, receiverName: string, rtcMessage: any },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`ICE candidate from ${client.data.user} to ${data.receiverName} in room ${client.data.roomName}`)

    client.to(client.data.roomName).emit('ICEcandidate', {
      sender: client.data.user,
      rtcMessage: data.rtcMessage
    })
  }
}