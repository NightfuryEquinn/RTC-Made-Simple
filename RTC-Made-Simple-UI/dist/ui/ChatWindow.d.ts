import React from 'react';
import { ChatMessage } from '../types/chat.types';
interface ChatWindowProps {
    userName: string;
    roomName: string;
    baseUrl: string;
    onMessageReceived?: (message: ChatMessage) => void;
    placeholder?: string;
    emptyStateText?: string;
    showTypingIndicator?: boolean;
    maxMessages?: number;
    loadHistory?: boolean;
}
export declare const ChatWindow: React.FC<ChatWindowProps>;
export {};
//# sourceMappingURL=ChatWindow.d.ts.map