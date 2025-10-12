import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dtos/send-message.dto";
import { MessageResponseDto } from "./dtos/message-response.dto";
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    sendMessage(body: SendMessageDto): Promise<MessageResponseDto>;
    getMessages(roomName: string, limit?: number): Promise<MessageResponseDto[]>;
}
//# sourceMappingURL=chat.controller.d.ts.map