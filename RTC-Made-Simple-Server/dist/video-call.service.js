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
exports.VideoCallService = void 0;
const common_1 = require("@nestjs/common");
const response_call_dto_1 = require("./dtos/response-call.dto");
let VideoCallService = class VideoCallService {
    constructor(callbacks) {
        this.callbacks = callbacks;
    }
    async createCall(callerName, receiverName) {
        if (this.callbacks?.onCallCreated) {
            await this.callbacks.onCallCreated(callerName, receiverName);
        }
        return new response_call_dto_1.ResponseCallDto({
            callId: Math.random().toString(36).substring(2, 15),
            callerId: callerName,
            receiverId: receiverName
        });
    }
    async endCall(callerName, receiverName, status) {
        if (this.callbacks?.onCallEnded) {
            await this.callbacks.onCallEnded(callerName, receiverName, status);
        }
        return {
            message: 'Call ended successfully',
            statusCode: 200
        };
    }
};
exports.VideoCallService = VideoCallService;
exports.VideoCallService = VideoCallService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)('VIDEO_CALL_CALLBACKS')),
    __metadata("design:paramtypes", [Object])
], VideoCallService);
//# sourceMappingURL=video-call.service.js.map