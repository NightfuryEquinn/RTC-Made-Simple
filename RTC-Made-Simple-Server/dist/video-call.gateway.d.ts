import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { VideoCallService } from "./video-call.service";
export declare class VideoCallGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly videoCallService;
    private readonly logger;
    constructor(videoCallService: VideoCallService);
    server: Server;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    private returnToHomeRoom;
    handleJoinCallRoom(data: {
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
    handlePeerReady(data: {
        roomName: string;
        callerName: string;
        receiverName: string;
    }, client: Socket): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
    handleNewCall(data: {
        receiverName: string;
        rtcMessage: any;
    }, client: Socket): Promise<void>;
    handleEndCall(data: {
        callerName: string;
        receiverName: string;
        conversationId?: number;
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
        conversationId?: number;
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