import { CallAcceptedData, CallDeclinedData, CallEndedData, IncomingCallData } from "../types/call.types";
interface UseVideoSocketProps {
    currentUser: string;
    baseUrl: string;
    ringingTimeoutMs?: number;
    onCallAccepted?: (data: CallAcceptedData) => void;
    onCallDeclined?: (data: CallDeclinedData) => void;
    onCallEnded?: (data: CallEndedData) => void;
}
export declare const useVideoSocket: ({ currentUser, baseUrl, ringingTimeoutMs, onCallAccepted, onCallDeclined, onCallEnded }: UseVideoSocketProps) => {
    incomingCall: IncomingCallData | null;
    isCallVisible: boolean;
    acceptCall: () => void;
    declineCall: (reason?: string) => void;
    cancelCall: () => void;
    initiateCall: (receiverName: string, conversationId: number) => void;
};
export {};
//# sourceMappingURL=useVideoSocket.d.ts.map