import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoCallModule } from '@nightfuryequinn/rtc-made-simple-server';

@Module({
  imports: [
    VideoCallModule.forRoot({
      callbacks: {
        onCallCreated: async (callerName: string, receiverName: string) => {
          console.log(`📞 Call created: ${callerName} → ${receiverName}`);
          // Add custom logic: save to database, send notifications, etc.
        },
        onCallEnded: async (callerName: string, receiverName: string, status: string) => {
          console.log(`📴 Call ended: ${callerName} → ${receiverName}, status: ${status}`);
          // Add custom logic: update database, analytics, etc.
        },
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
