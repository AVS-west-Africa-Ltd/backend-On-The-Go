export interface RouterCredentials {
  host: string;
  user: string;
  password: string;
  port?: number;
  timeout?: number;
  tls?: object;
  keepalive?: boolean;
}
