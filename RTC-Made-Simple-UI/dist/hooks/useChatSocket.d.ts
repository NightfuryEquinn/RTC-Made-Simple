import { ChatMessage, MessageDeletedData, MessageReadReceiptData, UserJoinedData, UserLeftData, UserTypingData } from "../types/chat.types";
interface UseChatSocketProps {
    userName: string;
    roomName: string;
    baseUrl: string;
    maxMessages?: number;
    loadHistory?: boolean;
    historyLimit?: number;
    onMessageReceived?: (message: ChatMessage) => void;
    onUserJoined?: (data: UserJoinedData) => void;
    onUserLeft?: (data: UserLeftData) => void;
    onUserTyping?: (data: UserTypingData) => void;
    onMessageRead?: (data: MessageReadReceiptData) => void;
    onMessageDeleted?: (data: MessageDeletedData) => void;
    autoConnect?: boolean;
}
export declare const useChatSocket: ({ userName, roomName, baseUrl, maxMessages, loadHistory, historyLimit, onMessageReceived, onUserJoined, onUserLeft, onUserTyping, onMessageRead, onMessageDeleted, autoConnect }: UseChatSocketProps) => {
    messages: ChatMessage[];
    typingUsers: string[];
    connectedUsers: string[];
    isConnected: boolean;
    connectionError: string | null;
    sendMessage: (message: string, receiverName?: string, metadata?: any) => void;
    joinRoom: (newRoomName: string) => void;
    setTyping: (isTyping: boolean) => void;
    markMessageAsRead: (messageId: string, senderName: string) => void;
    deleteMessage: (messageId: string) => void;
    loadMessages: (limit?: number) => void;
};
export {};
//# sourceMappingURL=useChatSocket.d.ts.map