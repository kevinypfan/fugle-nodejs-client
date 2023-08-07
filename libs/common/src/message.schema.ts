import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: String, required: true })
  hostname: string;

  @Prop({ type: Number, required: true })
  workerId: number;

  @Prop({ type: String, required: true })
  version: string;

  @Prop(
    raw({
      id: { type: String },
      symbol: { type: String },
      date: { type: String },
      event: { type: String },
      channel: { type: String },
      data: { type: Object },
    }),
  )
  message: Record<
    string,
    {
      id: string;
      symbol: string;
      date: string;
      event: string;
      channel: string;
      data: object;
    }
  >;
}

export const MessageSchema = SchemaFactory.createForClass(Message)
  .index({
    hostname: 1,
    workerId: 1,
    'message.event': 1,
    'message.channel': 1,
  })
  .index({
    hostname: 1,
    workerId: 1,
    'message.event': 1,
  })
  .index({
    hostname: 1,
    'message.event': 1,
  })
  .index({
    hostname: 1,
    workerId: 1,
  })
  .index({
    'message.event': 1,
    'message.date': -1,
    'message.symbol': 1,
  })
  .index({
    version: 1,
    'message.date': -1,
    'message.symbol': 1,
  })
  .index({
    'message.date': -1,
    'message.symbol': 1,
  })
  .index({
    'message.symbol': 1,
  })
  .index({
    version: 1,
    'message.symbol': 1,
  })
  .index({
    'message.event': 1,
    'message.channel': 1,
  });
