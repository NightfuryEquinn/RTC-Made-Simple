import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly logger;
    constructor(chatService: ChatService);
    server: Server;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(data: {
        roomName: string;
    }, client: Socket): Promise<{
        ok: boolean;
        error: string;
        roomName?: undefined;
    } | {
        ok: boolean;
        roomName: string;
        error?: undefined;
    }>;
    handleSendMessage(data: {
        message: string;
        receiverName?: string;
        metadata?: any;
        clientMessageId?: string;
    }, client: Socket): Promise<{
        ok: boolean;
        error: string;
        message?: undefined;
    } | {
        ok: boolean;
        message: {
            messageId: string;
            senderName: string;
            receiverName: string | null | undefined;
            message: string;
            roomName: string;
            metadata: any;
            timestamp: string;
            clientMessageId: string | undefined;
        };
        error?: undefined;
    }>;
    handleGetMessages(data: {
        roomName?: string;
        limit?: number;
    }, client: Socket): Promise<{
        ok: boolean;
        error: string;
        messages?: undefined;
    } | {
        ok: boolean;
        messages: import(".").MessageResponseDto[];
        error?: undefined;
    }>;
    handleTyping(data: {
        isTyping: boolean;
    }, client: Socket): Promise<void>;
    handleMessageRead(data: {
        messageId: string;
        senderName: string;
    }, client: Socket): Promise<void>;
    handleDeleteMessage(data: {
        messageId: string;
    }, client: Socket): Promise<void>;
}
//# sourceMappingURL=chat.gateway.d.ts.map