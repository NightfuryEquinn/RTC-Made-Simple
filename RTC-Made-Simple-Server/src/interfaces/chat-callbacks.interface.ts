import { MessageResponseDto } from "../dtos/message-response.dto";

export interface ChatCallbacks {
  onMessageSent?: (
    senderName: string,
    receiverName: string | null | undefined,
    message: string,
    roomName: string,
    metadata?: any
  ) => Promise<void | MessageResponseDto | Partial<MessageResponseDto>>;

  onMessageRead?: (
    messageId: string,
    readBy: string
  ) => Promise<void>;

  onMessageDeleted?: (
    messageId: string,
    deletedBy: string
  ) => Promise<void>;

  onGetMessages?: (
    roomName: string,
    limit?: number
  ) => Promise<MessageResponseDto[]>;

  /**
   * Optional connection gate. Return false to reject the socket handshake.
   * Authentication is not built-in; host apps should implement this.
   */
  canConnect?: (
    userName: string,
    roomName: string | undefined,
    handshake: Record<string, unknown>
  ) => Promise<boolean> | boolean;
}
