import { ChatServiceInterface } from "./interfaces/chat-service.interface";
import { ChatCallbacks } from "./interfaces/chat-callbacks.interface";
import { MessageResponseDto } from "./dtos/message-response.dto";
export declare class ChatService implements ChatServiceInterface {
    private readonly callbacks?;
    constructor(callbacks?: ChatCallbacks | undefined);
    saveMessage(senderName: string, receiverName: string | null | undefined, message: string, roomName: string, metadata?: any): Promise<MessageResponseDto>;
    markMessageAsRead(messageId: string, readBy: string): Promise<{
        message: string;
        statusCode: number;
    }>;
    deleteMessage(messageId: string, deletedBy: string): Promise<{
        message: string;
        statusCode: number;
    }>;
    getMessages(roomName: string, limit?: number): Promise<MessageResponseDto[]>;
    canConnect(userName: string, roomName: string | undefined, handshake: Record<string, unknown>): Promise<boolean>;
}
//# sourceMappingURL=chat.service.d.ts.map