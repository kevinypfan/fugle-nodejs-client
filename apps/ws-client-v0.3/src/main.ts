import { NestFactory } from '@nestjs/core';
import { WsClientV03Module } from './ws-client-v0.3.module';

async function bootstrap() {
  const app = await NestFactory.create(WsClientV03Module);
  await app.listen(3000);
}
bootstrap();
