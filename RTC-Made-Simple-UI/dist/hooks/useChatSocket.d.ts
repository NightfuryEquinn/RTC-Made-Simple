import { ChatMessage, UserJoinedData, UserLeftData, UserTypingData, MessageReadReceiptData, MessageDeletedData } from "../types/chat.types";
interface UseChatSocketProps {
    userName: string;
    roomName: string;
    baseUrl: string;
    onMessageReceived?: (message: ChatMessage) => void;
    onUserJoined?: (data: UserJoinedData) => void;
    onUserLeft?: (data: UserLeftData) => void;
    onUserTyping?: (data: UserTypingData) => void;
    onMessageRead?: (data: MessageReadReceiptData) => void;
    onMessageDeleted?: (data: MessageDeletedData) => void;
    autoConnect?: boolean;
}
export declare const useChatSocket: ({ userName, roomName, baseUrl, onMessageReceived, onUserJoined, onUserLeft, onUserTyping, onMessageRead, onMessageDeleted, autoConnect }: UseChatSocketProps) => {
    messages: ChatMessage[];
    typingUsers: string[];
    connectedUsers: string[];
    sendMessage: (message: string, receiverName?: string, metadata?: any) => void;
    joinRoom: (newRoomName: string) => void;
    setTyping: (isTyping: boolean) => void;
    markMessageAsRead: (messageId: string, senderName: string) => void;
    deleteMessage: (messageId: string) => void;
};
export {};
//# sourceMappingURL=useChatSocket.d.ts.map