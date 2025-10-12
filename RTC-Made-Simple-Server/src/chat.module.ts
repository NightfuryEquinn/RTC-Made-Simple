import { DynamicModule, Module } from "@nestjs/common";
import { ChatCallbacks } from "./interfaces/chat-callbacks.interface";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";

export interface ChatModuleOptions {
  callbacks?: ChatCallbacks,
  customService?: any
}

@Module({})
export class ChatModule {
  static forRoot(
    options?: ChatModuleOptions
  ): DynamicModule {
    return {
      module: ChatModule,
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useClass: options?.customService || ChatService
        },
        {
          provide: 'CHAT_CALLBACKS',
          useValue: options?.callbacks || {}
        }
      ],
      controllers: [
        ChatController
      ],
      exports: [
        ChatService,
        ChatGateway
      ]
    }
  }
}
