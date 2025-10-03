import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for REST API and WebSocket
  app.enableCors({
    origin: '*', // Configure this based on your frontend URL
    credentials: true,
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('RTC Made Simple API')
    .setDescription('WebRTC Video Call API with WebSocket support')
    .setVersion('1.0')
    .addTag('video-call', 'Video call endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}

bootstrap();
