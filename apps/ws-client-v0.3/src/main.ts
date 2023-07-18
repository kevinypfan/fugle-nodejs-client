import { NestFactory } from '@nestjs/core';
import { WsClientV03Module } from './ws-client-v0.3.module';

const PORT =
  parseInt(process.env.CLIENT_PORT || process.env.APP_PORT, 10) || 4881;

async function bootstrap() {
  const app = await NestFactory.create(WsClientV03Module);
  await app.listen(PORT);
}
bootstrap();
