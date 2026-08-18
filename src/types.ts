export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface FetchyConfig {
  prettyPrint: boolean;
  showHeaders: boolean;
  showBody: boolean;
  timing: boolean;
  verbose: boolean;
  follow: boolean;
  proxy?: string;
}

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
  interactive: boolean;
  send?: string;
  proxy?: string;
  follow: boolean;
  save?: string;
}

export interface HttpResult {
  response: Response;
  body: string;
  duration: number;
}