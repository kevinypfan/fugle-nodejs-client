import { Injectable, Logger } from '@nestjs/common';
import * as WebSocket from 'ws';
import * as fs from 'fs';
import * as os from 'os';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './message.schema';
import { Model } from 'mongoose';

@Injectable()
export class WsClientV03Service {
  private readonly logger = new Logger(WsClientV03Service.name);
  private readonly enableLogger = process.env.ENABLE_LOGGER === 'true';
  private readonly enableDbStorage = process.env.ENABLE_DB_STORAGE === 'true';
  private readonly enableFileStorage =
    process.env.ENABLE_FILE_STORAGE === 'true';

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async onApplicationBootstrap() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pws = require('pws')(
      `wss://api.fugle.tw/realtime/v0.3/intraday/quote?symbolId=${process.env.FUGLE_API_SYMBOL}&apiToken=${process.env.FUGLE_API_TOKEN}`,
      WebSocket,
    );

    pws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      const mergedData = { ...data.data.info, ...data.data.quote };
      const hostname = os.hostname();
      if (this.enableDbStorage) {
        const entity = new this.messageModel({
          hostname,
          message: {
            symbol: mergedData.symbolId,
            date: mergedData.date,
            event: 'quote',
            data: mergedData,
          },
          workerId: 0,
          version: '0.3',
        });

        await entity.save();
      }

      if (this.enableLogger) {
        this.logger.log(`${hostname}-${0}: ${event.data}`);
      }

      if (this.enableFileStorage) {
        fs.appendFileSync(
          `${hostname}-${0}-${this.formatDate(new Date())}-v0.3-log.jsonl`,
          `${event.data}\n`,
        );
      }
    };
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
