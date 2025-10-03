import { DynamicModule } from "@nestjs/common";
import { VideoCallCallbacks } from "./interfaces/video-call-callbacks.interface";
export interface VideoCallModuleOptions {
    callbacks?: VideoCallCallbacks;
    customService?: any;
}
export declare class VideoCallModule {
    static forRoot(options?: VideoCallModuleOptions): DynamicModule;
}
//# sourceMappingURL=video-call.module.d.ts.map