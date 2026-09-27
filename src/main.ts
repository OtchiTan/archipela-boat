import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WebSocket } from 'ws';
import { AppModule } from './app.module';

async function bootstrap() {
  if (!global.WebSocket) {
    (global as any).WebSocket = WebSocket
  }

  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({}),
    cors: true,
  });

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
