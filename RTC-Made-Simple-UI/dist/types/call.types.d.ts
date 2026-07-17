export interface IncomingCallData {
    callerName: string;
    receiverName: string;
    conversationId: number;
}
export interface CallDeclinedData {
    callerName: string;
    receiverName: string;
    reason: string;
}
export interface CallAcceptedData {
    callerName: string;
    receiverName: string;
    conversationId: number;
}
export interface CallEndedData {
    callerName: string;
    receiverName: string;
    conversationId?: number;
    endedBy?: string;
    reason?: string;
}
export interface PeerReadyData {
    userName: string;
    callerName: string;
    receiverName: string;
    roomName: string;
}
export interface VideoCallConfig {
    baseUrl: string;
    iceServers?: RTCIceServer[];
    mediaConstraints?: MediaStreamConstraints;
    ringingTimeoutMs?: number;
}
//# sourceMappingURL=call.types.d.ts.map