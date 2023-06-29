// import * as fs from 'fs';
import * as os from 'os';
import { Injectable } from '@nestjs/common';
import { WebSocketClient } from '@fugle/marketdata';
import { Message } from './message.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class WorkerService {
  private wsStockClient = null;
  private isConnected = false;
  public workerId: number;
  private subscriptionTopics: string[][] = JSON.parse(process.env.CLIENT_SUBS);

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
      const topics = this.subscriptionTopics[this.workerId - 1];
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
      const data = JSON.parse(message);
      const hostname = os.hostname();

      const entity = new this.messageModel({
        hostname,
        message: data,
        workerId: this.workerId,
      });

      await entity.save();
      // fs.appendFileSync(
      //   `${this.workerId}-${this.formatDate(new Date())}-log.jsonl`,
      //   `${message}\n`,
      // );
    });

    this.wsStockClient.on('open', () => {
      this.isConnected = true;
      console.log(`Established connection to fugle`);
    });

    this.wsStockClient.on('close', (e) => {
      this.isConnected = false;
      console.log(
        'Socket is closed. Reconnect will be attempted in 1 second.',
        e.reason,
      );
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

  async reconnect() {
    await this.wsStockClient.connect();
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
