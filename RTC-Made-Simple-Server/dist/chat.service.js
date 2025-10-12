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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const message_response_dto_1 = require("./dtos/message-response.dto");
let ChatService = class ChatService {
    constructor(callbacks) {
        this.callbacks = callbacks;
    }
    async saveMessage(senderName, receiverName, message, roomName, metadata) {
        if (this.callbacks?.onMessageSent) {
            await this.callbacks.onMessageSent(senderName, receiverName, message, roomName, metadata);
        }
        return new message_response_dto_1.MessageResponseDto({
            messageId: Math.random().toString(36).substring(2, 15),
            senderName: senderName,
            receiverName: receiverName,
            message: message,
            roomName: roomName,
            timestamp: new Date().toISOString(),
            metadata: metadata
        });
    }
    async markMessageAsRead(messageId, readBy) {
        if (this.callbacks?.onMessageRead) {
            await this.callbacks.onMessageRead(messageId, readBy);
        }
        return {
            message: 'Message marked as read',
            statusCode: 200
        };
    }
    async deleteMessage(messageId, deletedBy) {
        if (this.callbacks?.onMessageDeleted) {
            await this.callbacks.onMessageDeleted(messageId, deletedBy);
        }
        return {
            message: 'Message deleted successfully',
            statusCode: 200
        };
    }
    async getMessages(roomName, limit) {
        if (this.callbacks?.onGetMessages) {
            return await this.callbacks.onGetMessages(roomName, limit);
        }
        return [];
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)('CHAT_CALLBACKS')),
    __metadata("design:paramtypes", [Object])
], ChatService);
//# sourceMappingURL=chat.service.js.map