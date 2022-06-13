export interface ISocket {
  id: string;
  connected: boolean;
  disconnected: boolean;
  send: (data: unknown) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: any; //(data: any) => void;
  handshake: {
    headers: Record<string, string>;
    time: string;
    address: string;
    xdomain: boolean;
    secure: boolean;
    issued: number;
    url: string;
    query: {
      EIO: string;
      transport: string;
      t: string;
    };
    auth: { token: string };
  };
}
