import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoCallModule, ChatModule } from '@nightfuryequinn/rtc-made-simple-server';

@Module({
  imports: [
    VideoCallModule.forRoot({
      callbacks: {
        onCallCreated: async (callerName: string, receiverName: string) => {
          console.log(`Call created: ${callerName} → ${receiverName}`);
          // Add custom logic: save to database, send notifications, etc.
        },
        onCallEnded: async (callerName: string, receiverName: string, status: string) => {
          console.log(`Call ended: ${callerName} → ${receiverName}, status: ${status}`);
          // Add custom logic: update database, analytics, etc.
        },
      }
    }),
    ChatModule.forRoot({
      callbacks: {
        onMessageSent: async (senderName, receiverName, message, roomName, metadata) => {
          console.log(`💬 Message from ${senderName} in ${roomName}: ${message}`);
          // Add custom logic: save to database, moderate content, etc.
        },
        onMessageRead: async (messageId, readBy) => {
          console.log(`✓ Message ${messageId} read by ${readBy}`);
          // Add custom logic: update read status in database
        },
        onMessageDeleted: async (messageId, deletedBy) => {
          console.log(`🗑️ Message ${messageId} deleted by ${deletedBy}`);
          // Add custom logic: soft delete in database
        },
        onGetMessages: async (roomName, limit) => {
          console.log(`📥 Fetching messages for room ${roomName}, limit: ${limit}`);
          // Add custom logic: fetch messages from database
          return [];
        }
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
