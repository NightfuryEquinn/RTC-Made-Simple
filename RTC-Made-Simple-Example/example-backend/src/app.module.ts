import { Module } from '@nestjs/common';
import {
  CallStatus,
  ChatModule,
  MessageResponseDto,
  VideoCallModule,
} from '@nightfuryequinn/rtc-made-simple-server';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const messageStore = new Map<string, MessageResponseDto[]>();

@Module({
  imports: [
    VideoCallModule.forRoot({
      callbacks: {
        onCallCreated: async (callerName, receiverName, conversationId) => {
          console.log(
            `Call created: ${callerName} → ${receiverName} (conversation ${conversationId ?? 'n/a'})`,
          );
        },
        onCallEnded: async (callerName, receiverName, status: CallStatus) => {
          console.log(`Call ended: ${callerName} → ${receiverName}, status: ${status}`);
        },
        // Example gate: always allow in demo. Replace with auth checks in production.
        canConnect: async () => true,
      },
    }),
    ChatModule.forRoot({
      callbacks: {
        onMessageSent: async (senderName, receiverName, message, roomName, metadata) => {
          const saved = new MessageResponseDto({
            messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            senderName,
            receiverName,
            message,
            roomName,
            timestamp: new Date().toISOString(),
            metadata,
          });

          const existing = messageStore.get(roomName) ?? [];
          existing.push(saved);
          messageStore.set(roomName, existing.slice(-200));

          console.log(`Message from ${senderName} in ${roomName}: ${message}`);
          return saved;
        },
        onMessageRead: async (messageId, readBy) => {
          console.log(`Message ${messageId} read by ${readBy}`);
        },
        onMessageDeleted: async (messageId, deletedBy) => {
          for (const [roomName, messages] of messageStore.entries()) {
            messageStore.set(
              roomName,
              messages.filter((message) => message.messageId !== messageId),
            );
          }
          console.log(`Message ${messageId} deleted by ${deletedBy}`);
        },
        onGetMessages: async (roomName, limit = 50) => {
          const messages = messageStore.get(roomName) ?? [];
          return messages.slice(-limit);
        },
        canConnect: async () => true,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
