import * as fs from 'fs';
import * as os from 'os';
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketClient } from '@fugle/marketdata';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '@app/common/message.schema';

@Injectable()
export class WorkerService {
  private wsStockClient = null;
  private isConnected = false;
  public workerId: number;
  private subscriptionTopics: string[][] = JSON.parse(process.env.CLIENT_SUBS);
  private readonly logger = new Logger(WorkerService.name);
  private readonly enableLogger = process.env.ENABLE_LOGGER === 'true';
  private readonly enableDbStorage = process.env.ENABLE_DB_STORAGE === 'true';
  private readonly enableFileStorage =
    process.env.ENABLE_FILE_STORAGE === 'true';

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async onApplicationBootstrap() {
    this.initSDK();
    setTimeout(() => {
      this.connect();
    }, 0);
  }

  async initSDK() {
    const client = new WebSocketClient({ apiKey: process.env.FUGLE_API_KEY });
    this.wsStockClient = client.stock; // Stock REST API client

    // this.wsStockClient.connect().then(() => {
    //   this.wsStockClient.subscribe({ channel: 'trades', symbol: '2330' });
    // });
  }

  getStockSubscribes() {
    if (this.workerId) {
      const topics = this.subscriptionTopics[0];
      const stockTopics = topics.filter((topic) => topic.startsWith('stock'));

      const channelMap: Map<string, Set<string>> = new Map();

      stockTopics.forEach((topic) => {
        const [product, channel, symbol] = topic.split(':');
        const symbolSet = channelMap.get(channel);
        if (symbolSet) {
          symbolSet.add(symbol);
        } else {
          channelMap.set(channel, new Set([symbol]));
        }
      });

      const results = [];

      channelMap.forEach((value, key) => {
        const payload = {
          channel: key,
          symbols: Array.from(value),
        };
        results.push(payload);
      });

      return results;
    }

    return null;
  }

  async connect() {
    this.wsStockClient.on('message', async (message) => {
      // console.log(message);
      const data = JSON.parse(message);
      const hostname = os.hostname();

      if (this.enableDbStorage) {
        const entity = new this.messageModel({
          hostname,
          message: { symbol: data.data.symbol, date: data.data.date, ...data },
          workerId: this.workerId,
          version: '1.0',
        });

        await entity.save();
      }

      if (this.enableLogger) {
        this.logger.log(`${hostname}-${this.workerId}: ${message}`);
      }

      if (this.enableFileStorage) {
        fs.appendFileSync(
          `${hostname}-${this.workerId}-${this.formatDate(
            new Date(),
          )}-log.jsonl`,
          `${message}\n`,
        );
      }

      // console.log({
      //   enableDbStorage: this.enableDbStorage,
      //   enableLogger: this.enableLogger,
      //   enableFileStorage: this.enableFileStorage,
      // });
    });

    this.wsStockClient.on('open', () => {
      this.isConnected = true;
      console.log(`Established connection to fugle`);
    });

    this.wsStockClient.on('disconnect', async (e) => {
      this.isConnected = false;
      if (e.code === 1001) {
        this.logger.error(`${e.code}: ${e.reason}`);
      } else {
        this.logger.error(
          `Socket is closed. Reconnect will be attempted in 2 second. (${e.reason})`,
        );
        setTimeout(() => {
          this.wsStockClient.connect();
        }, 2000);
      }
    });

    this.wsStockClient.on('error', (e) => {
      this.isConnected = false;
      this.logger.error(`WebSocket error: ${e}`);
    });

    await this.wsStockClient.connect();
    this.subscribeChannels();
  }

  subscribeChannels() {
    const subscribes = this.getStockSubscribes();
    subscribes.forEach((payload) => {
      this.wsStockClient.subscribe(payload);
    });
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
