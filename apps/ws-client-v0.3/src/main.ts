import { NestFactory } from '@nestjs/core';
import { WsClientV03Module } from './ws-client-v0.3.module';

async function bootstrap() {
  const app = await NestFactory.create(WsClientV03Module);
}
bootstrap();
