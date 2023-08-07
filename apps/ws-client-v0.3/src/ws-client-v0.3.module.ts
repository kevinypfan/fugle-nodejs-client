import { Module } from '@nestjs/common';
import { WsClientV03Service } from './ws-client-v0.3.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../../../libs/common/src/message.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  controllers: [],
  providers: [WsClientV03Service],
})
export class WsClientV03Module {}
