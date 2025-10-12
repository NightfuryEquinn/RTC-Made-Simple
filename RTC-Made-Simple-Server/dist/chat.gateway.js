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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    constructor(chatService) {
        this.chatService = chatService;
    }
    handleConnection(client) {
        const userName = client.handshake.query.userName;
        const roomName = client.handshake.query.roomName;
        if (!userName) {
            client.disconnect();
            console.log('User name is required. Disconnected ...');
            return;
        }
        client.data.user = userName;
        client.data.roomName = roomName;
        client.join(roomName);
        console.log(`User ${userName} connected to chat room ${roomName}`);
        // Notify others in the room
        client.to(roomName).emit('userJoined', {
            userName: userName,
            roomName: roomName,
            timestamp: new Date().toISOString()
        });
    }
    handleDisconnect(client) {
        if (client.data.user && client.data.roomName) {
            console.log(`User ${client.data.user} disconnected from chat room ${client.data.roomName}`);
            // Notify others in the room
            client.to(client.data.roomName).emit('userLeft', {
                userName: client.data.user,
                roomName: client.data.roomName,
                timestamp: new Date().toISOString()
            });
        }
    }
    async handleJoinRoom(data, client) {
        const target = data.roomName;
        if (!target) {
            console.log('Target room name is required.');
            return;
        }
        // Leave current room
        if (client.data.roomName && client.data.roomName !== target) {
            client.leave(client.data.roomName);
            client.to(client.data.roomName).emit('userLeft', {
                userName: client.data.user,
                roomName: client.data.roomName,
                timestamp: new Date().toISOString()
            });
        }
        // Join new room
        client.join(target);
        client.data.roomName = target;
        console.log(`User ${client.data.user} joined chat room ${target}`);
        // Notify others in the new room
        client.to(target).emit('userJoined', {
            userName: client.data.user,
            roomName: target,
            timestamp: new Date().toISOString()
        });
    }
    async handleSendMessage(data, client) {
        const messageData = {
            senderName: client.data.user,
            receiverName: data.receiverName,
            message: data.message,
            roomName: client.data.roomName,
            metadata: data.metadata,
            timestamp: new Date().toISOString()
        };
        console.log(`Message from ${client.data.user} in room ${client.data.roomName}`);
        // If receiver is specified, send to specific user, otherwise broadcast to room
        if (data.receiverName) {
            client.to(client.data.roomName).emit('newMessage', messageData);
        }
        else {
            client.to(client.data.roomName).emit('newMessage', messageData);
        }
        // Save message via service
        try {
            await this.chatService.saveMessage(client.data.user, data.receiverName || null, data.message, client.data.roomName, data.metadata);
        }
        catch (error) {
            console.error('Error saving message:', error);
        }
    }
    async handleTyping(data, client) {
        console.log(`User ${client.data.user} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
        client.to(client.data.roomName).emit('userTyping', {
            userName: client.data.user,
            roomName: client.data.roomName,
            isTyping: data.isTyping,
            timestamp: new Date().toISOString()
        });
    }
    async handleMessageRead(data, client) {
        console.log(`Message ${data.messageId} read by ${client.data.user}`);
        client.to(client.data.roomName).emit('messageReadReceipt', {
            messageId: data.messageId,
            readBy: client.data.user,
            timestamp: new Date().toISOString()
        });
        try {
            await this.chatService.markMessageAsRead(data.messageId, client.data.user);
        }
        catch (error) {
            console.error('Error marking message as read:', error);
        }
    }
    async handleDeleteMessage(data, client) {
        console.log(`Message ${data.messageId} deleted by ${client.data.user}`);
        client.to(client.data.roomName).emit('messageDeleted', {
            messageId: data.messageId,
            deletedBy: client.data.user,
            roomName: client.data.roomName,
            timestamp: new Date().toISOString()
        });
        try {
            await this.chatService.deleteMessage(data.messageId, client.data.user);
        }
        catch (error) {
            console.error('Error deleting message:', error);
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('messageRead'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessageRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('deleteMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteMessage", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: true,
        transports: ['websocket'],
        path: '/chat'
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map