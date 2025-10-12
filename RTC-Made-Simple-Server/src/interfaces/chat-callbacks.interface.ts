import { MessageResponseDto } from "../dtos/message-response.dto";

export interface ChatCallbacks {
  onMessageSent?: (
    senderName: string,
    receiverName: string | null | undefined,
    message: string,
    roomName: string,
    metadata?: any
  ) => Promise<void>,
  
  onMessageRead?: (
    messageId: string,
    readBy: string
  ) => Promise<void>,
  
  onMessageDeleted?: (
    messageId: string,
    deletedBy: string
  ) => Promise<void>,
  
  onGetMessages?: (
    roomName: string,
    limit?: number
  ) => Promise<MessageResponseDto[]>
}
