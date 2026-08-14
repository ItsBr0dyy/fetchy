export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface CliOptions {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  prettyPrint: boolean;
  showHeaders: boolean;
  showBody: boolean;
  timing: boolean;
  verbose: boolean;
  websocket: boolean;
  send?: string;
  interactive: boolean;
}

export interface HttpResult {
  response: Response;
  body: string;
  duration: number;
}