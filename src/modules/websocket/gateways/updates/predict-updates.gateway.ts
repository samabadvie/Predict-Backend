import { InjectQueue } from '@nestjs/bull';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Job, Queue } from 'bull';
import { UserEntity } from 'modules/users/entities/user.entity';
import { ISocket } from 'modules/websocket/interfaces/socket.interface';

@WebSocketGateway({
  namespace: 'predictUpdates',
  cors: true,
})
export class PredictUpdatesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(@InjectQueue('predictUpdates') private readonly predictUpdatesQueue: Queue) {}

  @WebSocketServer()
  server!: {
    sockets: Map<string, ISocket>;
  };

  clients: Record<string, string[]> = {};

  afterInit(_server: unknown): void {
    this.predictUpdateProcess();
  }

  private predictUpdateProcess(): void {
    // console.log('I am in predictUpdateProcess');

    this.predictUpdatesQueue.process(
      (
        job: Job<{
          id: number;
          status: string;
          predict_point: number;
          user_data: UserEntity;
          score: string;
        }>,
      ) => {
        const clientIds = this.clients[job.data.user_data.id.toString()];
        // console.log('job.data:',job.data);
        // console.log('job.data.user_id:',job.data.user_id);

        // console.log('clientIds:', clientIds);

        if (clientIds.length) {
          clientIds.map((clientId) => {
            const client = this.server.sockets.get(clientId);
            if (client) {
              client.emit('predictUpdates', job.data);
            }
          });
        } else {
          this.predictUpdatesQueue.add(job.data);
        }

        return;
      },
    );
  }

  handleConnection(client: ISocket, ..._args: unknown[]): void {
    try {
      const user_id = client.handshake.auth.token;
      // console.log('user_id', user_id);
      // console.log('client.handshake:', client.handshake);

      if (this.clients[user_id]) {
        this.clients[user_id].push(client.id);
      } else {
        this.clients[user_id] = [client.id];
      }

      this.clients[user_id] = [...new Set(this.clients[user_id])];

      // console.log(' this.clients[user_id]:',  this.clients[user_id]);

      console.log(`user_id: ${user_id} connected`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log(e.message);
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
}
