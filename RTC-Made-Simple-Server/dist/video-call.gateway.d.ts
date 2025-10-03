import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { VideoCallService } from "./video-call.service";
export declare class VideoCallGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly videoCallService;
    constructor(videoCallService: VideoCallService);
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinCallRoom(data: {
        roomName: string;
    }, client: Socket): Promise<void>;
    handleNewCall(data: {
        receiverName: string;
        rtcMessage: any;
    }, client: Socket): Promise<void>;
    handleEndCall(data: {
        callerName: string;
        receiverName: string;
        conversationId: number;
    }, client: Socket): Promise<void>;
    handleIncomingCall(data: {
        receiverName: string;
        callerName: string;
        conversationId: number;
    }, client: Socket): Promise<void>;
    handleAcceptCall(data: {
        callerName: string;
        receiverName: string;
        conversationId: number;
    }, client: Socket): Promise<void>;
    handleDeclineCall(data: {
        callerName: string;
        receiverName: string;
        reason?: string;
    }, client: Socket): Promise<void>;
    handleCancelCall(data: {
        callerName: string;
        receiverName: string;
    }, client: Socket): Promise<void>;
    handleCallAnswered(data: {
        callerName: string;
        receiverName: string;
        rtcMessage: any;
    }, client: Socket): Promise<void>;
    handleICEcandidate(data: {
        callerName: string;
        receiverName: string;
        rtcMessage: any;
    }, client: Socket): Promise<void>;
}
//# sourceMappingURL=video-call.gateway.d.ts.map