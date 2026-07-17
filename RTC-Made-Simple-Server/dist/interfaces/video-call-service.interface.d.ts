import { CallStatus } from "../dtos/end-call.dto";
import { ResponseCallDto } from "../dtos/response-call.dto";
export interface VideoCallServiceInterface {
    createCall(callerName: string, receiverName: string, conversationId?: number): Promise<ResponseCallDto>;
    endCall(callerName: string, receiverName: string, status: CallStatus): Promise<any>;
}
//# sourceMappingURL=video-call-service.interface.d.ts.map