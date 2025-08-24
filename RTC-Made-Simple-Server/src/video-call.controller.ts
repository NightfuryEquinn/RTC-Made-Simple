import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { VideoCallService } from "./video-call.service";
import { CreateCallDto } from "./dtos/create-call.dto";
import { ResponseCallDto } from "./dtos/response-call.dto";
import { EndCallDto } from "./dtos/end-call.dto";

@ApiTags('Video Call')
@Controller('video-call')
export class VideoCallController {
  constructor(
    private videoCallService: VideoCallService
  ) {}

  @Post('create-call')
  @ApiBody({ type: CreateCallDto })
  @ApiOkResponse({ type: ResponseCallDto })
  async createCall(
    @Body() body: CreateCallDto
  ) {
    return await this.videoCallService.createCall(
      body.callerId, body.receiverId
    )
  }

  @Post('end-call')
  @ApiBody({ type: EndCallDto })
  @ApiOkResponse({ type: Object })
  async endCall(
    @Body() body: EndCallDto
  ) {
    return await this.videoCallService.endCall(
      body.callerId, body.receiverId, body.status
    )
  }
}