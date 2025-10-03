import { VideoCallServiceInterface } from "./interfaces/video-call-service.interface";
import { VideoCallCallbacks } from "./interfaces/video-call-callbacks.interface";
import { ResponseCallDto } from "./dtos/response-call.dto";
import { CallStatus } from "./dtos/end-call.dto";
export declare class VideoCallService implements VideoCallServiceInterface {
    private readonly callbacks?;
    constructor(callbacks?: VideoCallCallbacks | undefined);
    createCall(callerName: string, receiverName: string): Promise<ResponseCallDto>;
    endCall(callerName: string, receiverName: string, status: CallStatus): Promise<any>;
}
//# sourceMappingURL=video-call.service.d.ts.map