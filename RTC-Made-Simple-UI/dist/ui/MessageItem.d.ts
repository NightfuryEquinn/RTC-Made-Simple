import React from 'react';
import { ChatMessage } from '../types/chat.types';
interface MessageItemProps {
    message: ChatMessage;
    isOwnMessage: boolean;
    onLongPress?: (message: ChatMessage) => void;
    showSenderName?: boolean;
}
export declare const MessageItem: React.FC<MessageItemProps>;
export {};
//# sourceMappingURL=MessageItem.d.ts.map