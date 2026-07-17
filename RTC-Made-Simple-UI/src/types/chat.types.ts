export interface ChatMessage {
  messageId?: string;
  clientMessageId?: string;
  senderName: string;
  receiverName?: string | null;
  message: string;
  roomName: string;
  timestamp: string;
  metadata?: any;
  isRead?: boolean;
  readBy?: string[];
}

export interface UserJoinedData {
  userName: string;
  roomName: string;
  timestamp: string;
}

export interface UserLeftData {
  userName: string;
  roomName: string;
  timestamp: string;
}

export interface UserTypingData {
  userName: string;
  roomName: string;
  isTyping: boolean;
  timestamp: string;
}

export interface MessageReadReceiptData {
  messageId: string;
  readBy: string;
  timestamp: string;
}

export interface MessageDeletedData {
  messageId: string;
  deletedBy: string;
  roomName: string;
  timestamp: string;
}

export interface MessageHistoryData {
  roomName: string;
  messages: ChatMessage[];
}

export interface ChatConfig {
  baseUrl: string;
  roomName: string;
  userName: string;
  maxMessages?: number;
  enableTypingIndicator?: boolean;
}
