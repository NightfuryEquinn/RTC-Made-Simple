"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var VideoCallModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCallModule = void 0;
const common_1 = require("@nestjs/common");
const video_call_gateway_1 = require("./video-call.gateway");
const video_call_service_1 = require("./video-call.service");
const video_call_controller_1 = require("./video-call.controller");
let VideoCallModule = VideoCallModule_1 = class VideoCallModule {
    static forRoot(options) {
        return {
            module: VideoCallModule_1,
            providers: [
                video_call_gateway_1.VideoCallGateway,
                {
                    provide: video_call_service_1.VideoCallService,
                    useClass: options?.customService || video_call_service_1.VideoCallService
                },
                {
                    provide: 'VIDEO_CALL_CALLBACKS',
                    useValue: options?.callbacks || {}
                }
            ],
            controllers: [
                video_call_controller_1.VideoCallController
            ],
            exports: [
                video_call_service_1.VideoCallService,
                video_call_gateway_1.VideoCallGateway
            ]
        };
    }
};
exports.VideoCallModule = VideoCallModule;
exports.VideoCallModule = VideoCallModule = VideoCallModule_1 = __decorate([
    (0, common_1.Module)({})
], VideoCallModule);
//# sourceMappingURL=video-call.module.js.map