import { DynamicModule, Module } from "@nestjs/common";
import { VideoCallCallbacks } from "./interfaces/video-call-callback.interface";
import { VideoCallGateway } from "./video-call.gateway";
import { VideoCallService } from "./video-call.service";
import { VideoCallController } from "./video-call.controller";

export interface VideoCallModuleOptions {
  callbacks?: VideoCallCallbacks,
  customService?: any
}

@Module({})
export class VideoCallModule {
  static forRoot(
    options?: VideoCallModuleOptions
  ): DynamicModule {
    return {
      module: VideoCallModule,
      providers: [
        VideoCallGateway,
        {
          provide: VideoCallService,
          useClass: options?.customService || VideoCallService
        },
        {
          provide: 'VIDEO_CALL_CALLBACKS',
          useValue: options?.callbacks || {}
        }
      ],
      controllers: [
        VideoCallController
      ],
      exports: [
        VideoCallService,
        VideoCallGateway
      ]
    }
  }
}