import { VideoCallService } from "./video-call.service";
import { CreateCallDto } from "./dtos/create-call.dto";
import { ResponseCallDto } from "./dtos/response-call.dto";
import { EndCallDto } from "./dtos/end-call.dto";
export declare class VideoCallController {
    private videoCallService;
    constructor(videoCallService: VideoCallService);
    createCall(body: CreateCallDto): Promise<ResponseCallDto>;
    endCall(body: EndCallDto): Promise<any>;
}
//# sourceMappingURL=video-call.controller.d.ts.map