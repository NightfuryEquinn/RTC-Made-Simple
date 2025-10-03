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
exports.VideoCallController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const video_call_service_1 = require("./video-call.service");
const create_call_dto_1 = require("./dtos/create-call.dto");
const response_call_dto_1 = require("./dtos/response-call.dto");
const end_call_dto_1 = require("./dtos/end-call.dto");
let VideoCallController = class VideoCallController {
    constructor(videoCallService) {
        this.videoCallService = videoCallService;
    }
    async createCall(body) {
        return await this.videoCallService.createCall(body.callerId, body.receiverId);
    }
    async endCall(body) {
        return await this.videoCallService.endCall(body.callerId, body.receiverId, body.status);
    }
};
exports.VideoCallController = VideoCallController;
__decorate([
    (0, common_1.Post)('create-call'),
    (0, swagger_1.ApiBody)({ type: create_call_dto_1.CreateCallDto }),
    (0, swagger_1.ApiOkResponse)({ type: response_call_dto_1.ResponseCallDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_call_dto_1.CreateCallDto]),
    __metadata("design:returntype", Promise)
], VideoCallController.prototype, "createCall", null);
__decorate([
    (0, common_1.Post)('end-call'),
    (0, swagger_1.ApiBody)({ type: end_call_dto_1.EndCallDto }),
    (0, swagger_1.ApiOkResponse)({ type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [end_call_dto_1.EndCallDto]),
    __metadata("design:returntype", Promise)
], VideoCallController.prototype, "endCall", null);
exports.VideoCallController = VideoCallController = __decorate([
    (0, swagger_1.ApiTags)('Video Call'),
    (0, common_1.Controller)('video-call'),
    __metadata("design:paramtypes", [video_call_service_1.VideoCallService])
], VideoCallController);
//# sourceMappingURL=video-call.controller.js.map