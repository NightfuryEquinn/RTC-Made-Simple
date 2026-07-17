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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor(chatService) {
        this.chatService = chatService;
        this.logger = new common_1.Logger(ChatGateway_1.name);
    }
    async handleConnection(client) {
        const userName = client.handshake.query.userName;
        const roomName = client.handshake.query.roomName || undefined;
        if (!userName) {
            this.logger.warn('User name is required. Disconnecting client.');
            client.emit('error', { message: 'userName is required' });
            client.disconnect();
            return;
        }
        const allowed = await this.chatService.canConnect(userName, roomName, client.handshake.query);
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
    handleDisconnect(client) {
        if (client.data.user && client.data.roomName) {
            this.logger.log(`User ${client.data.user} disconnected from chat room ${client.data.roomName}`);
            client.to(client.data.roomName).emit('userLeft', {
                userName: client.data.user,
                roomName: client.data.roomName,
                timestamp: new Date().toISOString()
            });
        }
    }
    async handleJoinRoom(data, client) {
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
    async handleSendMessage(data, client) {
        if (!client.data.roomName) {
            client.emit('error', { message: 'Join a room before sending messages' });
            return { ok: false, error: 'Join a room before sending messages' };
        }
        if (!data?.message?.trim()) {
            client.emit('error', { message: 'Message is required' });
            return { ok: false, error: 'Message is required' };
        }
        try {
            const saved = await this.chatService.saveMessage(client.data.user, data.receiverName || null, data.message.trim(), client.data.roomName, data.metadata);
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
            this.logger.log(`Message ${saved.messageId} from ${client.data.user} in room ${client.data.roomName}`);
            client.to(client.data.roomName).emit('newMessage', messageData);
            client.emit('messageAck', messageData);
            return { ok: true, message: messageData };
        }
        catch (error) {
            this.logger.error('Error saving message', error);
            client.emit('error', { message: 'Failed to send message' });
            return { ok: false, error: 'Failed to send message' };
        }
    }
    async handleGetMessages(data, client) {
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
        }
        catch (error) {
            this.logger.error('Error fetching messages', error);
            client.emit('error', { message: 'Failed to fetch messages' });
            return { ok: false, error: 'Failed to fetch messages' };
        }
    }
    async handleTyping(data, client) {
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
    async handleMessageRead(data, client) {
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
        }
        catch (error) {
            this.logger.error('Error marking message as read', error);
        }
    }
    async handleDeleteMessage(data, client) {
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
        }
        catch (error) {
            this.logger.error('Error deleting message', error);
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
    (0, websockets_1.SubscribeMessage)('getMessages'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleGetMessages", null);
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
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: true,
        transports: ['websocket'],
        path: '/chat'
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map