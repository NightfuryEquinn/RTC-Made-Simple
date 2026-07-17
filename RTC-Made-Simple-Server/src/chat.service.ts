import { Inject, Injectable, Optional } from "@nestjs/common";
import { ChatServiceInterface } from "./interfaces/chat-service.interface";
import { ChatCallbacks } from "./interfaces/chat-callbacks.interface";
import { MessageResponseDto } from "./dtos/message-response.dto";

@Injectable()
export class ChatService implements ChatServiceInterface {
  constructor(
    @Optional() @Inject('CHAT_CALLBACKS')
    private readonly callbacks?: ChatCallbacks
  ) {}

  async saveMessage(
    senderName: string,
    receiverName: string | null | undefined,
    message: string,
    roomName: string,
    metadata?: any
  ): Promise<MessageResponseDto> {
    let callbackResult: void | MessageResponseDto | Partial<MessageResponseDto> =
      undefined;

    if (this.callbacks?.onMessageSent) {
      callbackResult = await this.callbacks.onMessageSent(
        senderName,
        receiverName,
        message,
        roomName,
        metadata
      );
    }

    const messageId =
      (callbackResult && typeof callbackResult === 'object' && callbackResult.messageId) ||
      Math.random().toString(36).substring(2, 15);

    return new MessageResponseDto({
      messageId,
      senderName,
      receiverName,
      message,
      roomName,
      timestamp:
        (callbackResult && typeof callbackResult === 'object' && callbackResult.timestamp) ||
        new Date().toISOString(),
      metadata:
        (callbackResult && typeof callbackResult === 'object' && callbackResult.metadata) ||
        metadata
    });
  }

  async markMessageAsRead(
    messageId: string,
    readBy: string
  ): Promise<{ message: string; statusCode: number }> {
    if (this.callbacks?.onMessageRead) {
      await this.callbacks.onMessageRead(messageId, readBy);
    }

    return {
      message: 'Message marked as read',
      statusCode: 200
    };
  }

  async deleteMessage(
    messageId: string,
    deletedBy: string
  ): Promise<{ message: string; statusCode: number }> {
    if (this.callbacks?.onMessageDeleted) {
      await this.callbacks.onMessageDeleted(messageId, deletedBy);
    }

    return {
      message: 'Message deleted successfully',
      statusCode: 200
    };
  }

  async getMessages(
    roomName: string,
    limit?: number
  ): Promise<MessageResponseDto[]> {
    if (this.callbacks?.onGetMessages) {
      return await this.callbacks.onGetMessages(roomName, limit);
    }

    return [];
  }

  async canConnect(
    userName: string,
    roomName: string | undefined,
    handshake: Record<string, unknown>
  ): Promise<boolean> {
    if (!this.callbacks?.canConnect) {
      return true;
    }
    return Boolean(await this.callbacks.canConnect(userName, roomName, handshake));
  }
}
