import { MessageResponseDto } from "../dtos/message-response.dto";

export interface ChatServiceInterface {
  saveMessage(
    senderName: string,
    receiverName: string | null | undefined,
    message: string,
    roomName: string,
    metadata?: any
  ): Promise<MessageResponseDto>,
  
  markMessageAsRead(
    messageId: string,
    readBy: string
  ): Promise<any>,
  
  deleteMessage(
    messageId: string,
    deletedBy: string
  ): Promise<any>,
  
  getMessages(
    roomName: string,
    limit?: number
  ): Promise<MessageResponseDto[]>
}
