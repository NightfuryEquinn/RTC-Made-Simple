import { Inject, Injectable, Optional } from "@nestjs/common";
import { VideoCallServiceInterface } from "./interfaces/video-call-service.interface";
import { VideoCallCallbacks } from "./interfaces/video-call-callbacks.interface";
import { ResponseCallDto } from "./dtos/response-call.dto";
import { CallStatus } from "./dtos/end-call.dto";

@Injectable()
export class VideoCallService implements VideoCallServiceInterface {
  constructor(
    @Optional() @Inject('VIDEO_CALL_CALLBACKS')
    private readonly callbacks?: VideoCallCallbacks
  ) {}

  async createCall(
    callerName: string,
    receiverName: string,
    conversationId?: number
  ): Promise<ResponseCallDto> {
    if (this.callbacks?.onCallCreated) {
      await this.callbacks.onCallCreated(callerName, receiverName, conversationId);
    }

    return new ResponseCallDto({
      callId: Math.random().toString(36).substring(2, 15),
      callerId: callerName,
      receiverId: receiverName
    });
  }

  async endCall(
    callerName: string,
    receiverName: string,
    status: CallStatus
  ): Promise<{ message: string; statusCode: number }> {
    if (this.callbacks?.onCallEnded) {
      await this.callbacks.onCallEnded(callerName, receiverName, status);
    }

    return {
      message: 'Call ended successfully',
      statusCode: 200
    };
  }

  async canConnect(
    callerName: string,
    roomName: string | undefined,
    handshake: Record<string, unknown>
  ): Promise<boolean> {
    if (!this.callbacks?.canConnect) {
      return true;
    }
    return Boolean(await this.callbacks.canConnect(callerName, roomName, handshake));
  }
}
