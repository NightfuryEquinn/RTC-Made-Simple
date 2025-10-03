"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCallGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const video_call_service_1 = require("./video-call.service");
const end_call_dto_1 = require("./dtos/end-call.dto");
let VideoCallGateway = class VideoCallGateway {
    constructor(videoCallService) {
        this.videoCallService = videoCallService;
    }
    handleConnection(client) {
        const callerName = client.handshake.query.callerName;
        const roomName = client.handshake.query.roomName;
        if (!callerName) {
            client.disconnect();
            console.log('Caller name is required. Disconnected ...');
            return;
        }
        client.data.user = callerName;
        client.data.homeRoom = roomName;
        client.data.roomName = roomName;
        client.join(roomName);
        console.log(`Caller ${callerName} connected to room ${client.data.roomName}`);
    }
    handleDisconnect(client) {
        if (client.data.user && client.data.roomName) {
            console.log(`User ${client.data.user} disconnected from room ${client.data.roomName}`);
        }
    }
    async handleJoinCallRoom(data, client) {
        const target = data.roomName;
        if (!target) {
            console.log('Target room name is required.');
            return;
        }
        if (client.data.roomName && client.data.roomName !== target) {
            client.leave(client.data.roomName);
        }
        client.join(target);
        client.data.roomName = target;
        console.log(`User ${client.data.user} switched back to room ${client.data.roomName}`);
    }
    async handleNewCall(data, client) {
        console.log(`Call from ${client.data.user} to ${data.receiverName} in room ${client.data.roomName}`);
        client.to(client.data.roomName).emit('newCall', {
            callerName: client.data.user,
            receiverName: data.receiverName,
            rtcMessage: data.rtcMessage
        });
    }
    async handleEndCall(data, client) {
        console.log(`Call ended by ${client.data.user} in room ${client.data.roomName}`);
        client.to(client.data.roomName).emit('callEnded', {
            callerName: data.callerName,
            receiverName: data.receiverName,
            conversationId: data.conversationId,
            endedBy: client.data.user
        });
        client.leave(client.data.roomName);
        client.join(client.data.homeRoom);
        client.data.roomName = client.data.homeRoom;
        console.log(`User ${client.data.user} returned to home room ${client.data.roomName}`);
        try {
            await this.videoCallService.endCall(data.callerName, data.receiverName, end_call_dto_1.CallStatus.ACCEPTED);
        }
        catch (error) {
            console.error('Error ending call:', error);
        }
    }
    async handleIncomingCall(data, client) {
        console.log(`Incoming call from ${data.callerName} to ${data.receiverName} in room ${client.data.roomName}`);
        client.to(client.data.roomName).emit('incomingCall', {
            callerName: data.callerName,
            receiverName: data.receiverName,
            conversationId: data.conversationId,
            roomName: client.data.roomName
        });
        try {
            await this.videoCallService.createCall(data.callerName, data.receiverName);
        }
        catch (error) {
            console.error('Error ending call:', error);
        }
    }
    async handleAcceptCall(data, client) {
        console.log(`Call accepted by ${data.receiverName} from ${data.callerName}`);
        client.to(client.data.roomName).emit('callAccepted', {
            callerName: data.callerName,
            receiverName: data.receiverName,
            conversationId: data.conversationId,
            roomName: client.data.roomName
        });
    }
    async handleDeclineCall(data, client) {
        console.log(`Call declined by ${data.callerName} to ${data.receiverName}`);
        const targetRoom = client.data.roomName;
        client.to(targetRoom).emit('callDeclined', {
            callerName: data.callerName,
            receiverName: data.receiverName,
            reason: data.reason || 'Call declined'
        });
        client.leave(targetRoom);
        client.join(client.data.homeRoom);
        client.data.roomName = client.data.homeRoom;
        console.log(`User ${client.data.user} returned to home room ${client.data.roomName}`);
        try {
            await this.videoCallService.endCall(data.callerName, data.receiverName, end_call_dto_1.CallStatus.REJECTED);
        }
        catch (error) {
            console.error('Error declining call:', error);
        }
    }
    async handleCancelCall(data, client) {
        console.log(`Call cancelled by ${data.callerName} to ${data.receiverName}`);
        const targetRoom = client.data.roomName;
        client.to(targetRoom).emit('callEnded', {
            callerName: data.callerName,
            receiverName: data.receiverName,
            reason: 'Call cancelled'
        });
        client.leave(targetRoom);
        client.join(client.data.homeRoom);
        client.data.roomName = client.data.homeRoom;
        console.log(`User ${client.data.user} returned to home room ${client.data.roomName}`);
        try {
            await this.videoCallService.endCall(data.callerName, data.receiverName, end_call_dto_1.CallStatus.ENDED);
        }
        catch (error) {
            console.error('Error cancelling call:', error);
        }
    }
    async handleCallAnswered(data, client) {
        console.log(`Call answered by ${client.data.user} from ${data.callerName} in room ${client.data.roomName}`);
        client.to(client.data.roomName).emit('callAnswered', {
            callerName: data.callerName,
            receiverName: data.receiverName,
            rtcMessage: data.rtcMessage
        });
    }
    async handleICEcandidate(data, client) {
        console.log(`ICE candidate from ${client.data.user} to ${data.receiverName} in room ${client.data.roomName}`);
        client.to(client.data.roomName).emit('ICEcandidate', {
            sender: client.data.user,
            rtcMessage: data.rtcMessage
        });
    }
};
exports.VideoCallGateway = VideoCallGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], VideoCallGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinCallRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VideoCallGateway.prototype, "handleJoinCallRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('newCall'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VideoCallGateway.prototype, "handleNewCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('endCall'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VideoCallGateway.prototype, "handleEndCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('incomingCall'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VideoCallGateway.prototype, "handleIncomingCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('acceptCall'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VideoCallGateway.prototype, "handleAcceptCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('declineCall'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VideoCallGateway.prototype, "handleDeclineCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('cancelCall'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VideoCallGateway.prototype, "handleCancelCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('callAnswered'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VideoCallGateway.prototype, "handleCallAnswered", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ICEcandidate'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VideoCallGateway.prototype, "handleICEcandidate", null);
exports.VideoCallGateway = VideoCallGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: true,
        transports: ['websocket'],
        path: '/call'
    }),
    __metadata("design:paramtypes", [video_call_service_1.VideoCallService])
], VideoCallGateway);
//# sourceMappingURL=video-call.gateway.js.map