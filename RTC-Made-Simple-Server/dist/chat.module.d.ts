import { DynamicModule } from "@nestjs/common";
import { ChatCallbacks } from "./interfaces/chat-callbacks.interface";
export interface ChatModuleOptions {
    callbacks?: ChatCallbacks;
    customService?: any;
}
export declare class ChatModule {
    static forRoot(options?: ChatModuleOptions): DynamicModule;
}
//# sourceMappingURL=chat.module.d.ts.map