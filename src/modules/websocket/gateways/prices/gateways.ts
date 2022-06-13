import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { ISocket } from '../../interfaces/socket.interface';
import WebSocket from 'ws';
import { from, map, Observable } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';

@WebSocketGateway({
  namespace: 'prices/messari',
  cors: true,
})
export class MessariGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: {
    sockets: Map<string, ISocket>;
  };

  clients: Record<string, string[]> = {};

  socket: WebSocket | undefined;

  data: Record<string, string> = {};

  //Each Hour Restart Messari WebSocket
  @Cron(CronExpression.EVERY_30_MINUTES)
  pricesCron(): void {
    this.socket = new WebSocket(`wss://data.messari.io/api/v2/updates/assets/metrics/market-data?limit=1000`);
    this.socket.onmessage = (data): void => {
      data.data
        .toString()
        .split('\n')
        .map((dataLine) => {
          const [id, ...prices] = dataLine.split(',');
          this.data[id] = prices.join(',');
        });
      this.prices();
    };
    this.socket.onerror = (error): void => {
      console.log(`websocket error symbol`, error);
      this.socket = new WebSocket(`wss://data.messari.io/api/v2/updates/assets/metrics/market-data?limit=1000`);
    };
  }

  handleConnection(client: ISocket, ..._args: unknown[]): void {
    // console.log(`${client.id} connected, requested: ${client.handshake.assets.join(',')}`);
    console.log(`${client.id} connected`);

    if (!this.socket) {
      this.socket = new WebSocket(`wss://data.messari.io/api/v2/updates/assets/metrics/market-data?limit=1000`);
      this.socket.onmessage = (data): void => {
        data.data
          .toString()
          .split('\n')
          .map((dataLine) => {
            const [id, ...prices] = dataLine.split(',');
            this.data[id] = prices.join(',');
          });
        this.prices();
      };
      this.socket.onerror = (error): void => {
        console.log(`websocket error symbol`, error);
        this.socket = new WebSocket(`wss://data.messari.io/api/v2/updates/assets/metrics/market-data?limit=1000`);
      };
    }
  }

  handleDisconnect(client: ISocket): void {
    Object.keys(this.clients).map((symbol) => {
      const clients = this.clients[symbol];
      const index = clients.indexOf(client.id);
      if (index > -1) {
        this.clients[symbol].splice(index, 1);
      }
    });
  }

  @SubscribeMessage('subscribe')
  onEvent(@MessageBody() ids: string[], @ConnectedSocket() client: ISocket): Observable<WsResponse<string>> {
    const event = 'subscribe';
    // console.log(client.id, ids);

    if (!Array.isArray(ids)) {
      ids = [ids];
    }

    ids = [...new Set(ids)];

    if (ids.length) {
      this.clients[client.id] = ids;
    }

    return from(ids).pipe(map((data) => ({ event, data })));
  }

  prices(): void {
    this.server.sockets.forEach((r) => {
      const subscribedAssets = this.clients[r.id];
      // console.log(subscribedAssets, r.id);

      if (subscribedAssets && subscribedAssets.length) {
        const output: Record<string, string> = {};
        subscribedAssets.map((sa) => {
          output[sa] = this.data[sa];
        });
        if (Object.keys(output).length) return r.send(output);
      }
    });
  }
}
