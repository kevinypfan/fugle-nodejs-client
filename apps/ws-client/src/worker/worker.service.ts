import { Injectable } from '@nestjs/common';
import { WebSocketClient } from '@fugle/marketdata';

@Injectable()
export class WorkerService {
  private readonly wsClient: Map<string, WebSocket> = new Map();

  async onApplicationBootstrap() {
    this.createSDKConnection();
  }

  async createSDKConnection() {
    const client = new WebSocketClient({ apiKey: process.env.FUGLE_API_KEY });
    const stock = client.stock; // Stock REST API client

    // open the WebSocket connection and authenticate
    stock.connect().then(() => {
      // subscribe the channel to receive streaming data
      stock.subscribe({ channel: 'trades', symbol: '2330' });
    });

    stock.on('message', (message) => {
      const data = JSON.parse(message);
      console.log(data);
    });
  }
}
