import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    constructor(chatService: ChatService);
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(data: {
        roomName: string;
    }, client: Socket): Promise<void>;
    handleSendMessage(data: {
        message: string;
        receiverName?: string;
        metadata?: any;
    }, client: Socket): Promise<void>;
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