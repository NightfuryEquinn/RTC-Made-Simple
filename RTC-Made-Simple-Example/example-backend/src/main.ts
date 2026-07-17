import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);
  const corsOrigin = process.env.CORS_ORIGIN ?? '*';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((value) => value.trim()),
    credentials: corsOrigin !== '*',
  });

  const config = new DocumentBuilder()
    .setTitle('RTC Made Simple API')
    .setDescription(
      'Example NestJS host for WebRTC signaling and chat. This demo has no authentication.',
    )
    .setVersion('1.0')
    .addTag('video-call', 'Video call REST endpoints')
    .addTag('chat', 'Chat REST endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  console.log('Security note: demo uses open sockets and trusts callerName/userName query params.');
}

bootstrap();
