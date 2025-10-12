"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ChatModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const chat_gateway_1 = require("./chat.gateway");
const chat_service_1 = require("./chat.service");
const chat_controller_1 = require("./chat.controller");
let ChatModule = ChatModule_1 = class ChatModule {
    static forRoot(options) {
        return {
            module: ChatModule_1,
            providers: [
                chat_gateway_1.ChatGateway,
                {
                    provide: chat_service_1.ChatService,
                    useClass: options?.customService || chat_service_1.ChatService
                },
                {
                    provide: 'CHAT_CALLBACKS',
                    useValue: options?.callbacks || {}
                }
            ],
            controllers: [
                chat_controller_1.ChatController
            ],
            exports: [
                chat_service_1.ChatService,
                chat_gateway_1.ChatGateway
            ]
        };
    }
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = ChatModule_1 = __decorate([
    (0, common_1.Module)({})
], ChatModule);
//# sourceMappingURL=chat.module.js.map