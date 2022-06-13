import { InjectQueue } from '@nestjs/bull';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Job, Queue } from 'bull';
import { ISocket } from 'modules/websocket/interfaces/socket.interface';

@WebSocketGateway({
  namespace: 'updates',
  cors: true,
})
export class UpdatesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(@InjectQueue('updates') private readonly updatesQueue: Queue) {}

  @WebSocketServer()
  server!: {
    sockets: Map<string, ISocket>;
  };

  clients: Record<string, string[]> = {};

  afterInit(_server: unknown): void {
    this.updateProcess();
  }

  private updateProcess(): void {
    // console.log('I am in accessRequestUpdateProcess');

    this.updatesQueue.process(
      (
        job: Job<{
          user_id: number;
          type: string;
          num_of_access_request?: number;
          num_of_follower?: number;
          badge_id?: number;
          badge_name?: string;
          icon?: string;
          level?: number;
          silver_chips?: number;
          golden_chips?: number;
          silver_chips_amount?: number;
          newLogin: boolean;
        }>,
      ) => {
        const clientIds = this.clients[job.data.user_id.toString()];
        // console.log('job.data:', job.data);
        // console.log('job.data.user_id:', job.data.user_id);

        // console.log('clientIds:', clientIds);

        if (clientIds.length) {
          clientIds.map((clientId) => {
            const client = this.server.sockets.get(clientId);
            if (client) {
              client.emit('updates', job.data);
            }
          });
        } else {
          this.updatesQueue.add(job.data);
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

      console.log(`${client.id} connected`);
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
