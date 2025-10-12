import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dtos/send-message.dto";
import { MessageResponseDto } from "./dtos/message-response.dto";

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService
  ) {}

  @Post('send-message')
  @ApiBody({ type: SendMessageDto })
  @ApiOkResponse({ type: MessageResponseDto })
  async sendMessage(
    @Body() body: SendMessageDto
  ) {
    return await this.chatService.saveMessage(
      body.senderName,
      body.receiverName,
      body.message,
      body.roomName,
      body.metadata
    )
  }

  @Get('messages')
  @ApiQuery({ name: 'roomName', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: [MessageResponseDto] })
  async getMessages(
    @Query('roomName') roomName: string,
    @Query('limit') limit?: number
  ) {
    return await this.chatService.getMessages(roomName, limit)
  }
}
