import { request } from "./http.ts";
import { connectWebSocket } from "./websocket.ts";
import {
  printError,
  printHttpResult,
} from "./formatter.ts";
import type {
  CliOptions,
  HttpMethod,
} from "./types.ts";
import packageJson from "../package.json";

function printHelp(): void {
  console.log(`
fetchy v${packageJson.version}

A fast HTTP and WebSocket debugging tool.

Usage:
  fetchy <url> [options]

Examples:
  fetchy https://example.com
  fetchy https://api.github.com/users/ItsBr0dyy --pretty-print
  fetchy https://example.com -X POST -d '{"hello":"world"}'
  fetchy https://example.com -H "Authorization: Bearer token"
  fetchy ws://localhost:3000
  fetchy ws://localhost:3000 --interactive
  fetchy ws://localhost:3000 --send '{"type":"ping"}'

Options:
  -X, --method <method>       HTTP method
  -H, --header <header>       Request header
  -d, --data <body>           Request body

      --pretty-print          Pretty-print JSON
      --headers               Show response headers
      --body                  Show response body
      --timing                Show request timing
      --verbose               Show everything

      --send <message>        Send a WebSocket message
      --interactive           Interactive WebSocket mode

  -v, --version               Show version
  -h, --help                  Show help
`);
}

function parseHeader(value: string): [string, string] {
  const separator = value.indexOf(":");

  if (separator === -1) {
    throw new Error(
      `Invalid header "${value}". Expected "Name: Value".`
    );
  }

  const key = value.slice(0, separator).trim();
  const headerValue = value.slice(separator + 1).trim();

  if (!key || !headerValue) {
    throw new Error(
      `Invalid header "${value}". Expected "Name: Value".`
    );
  }

  return [key, headerValue];
}

function getArgValue(
  args: string[],
  index: number,
  flag: string
): string {
  const value = args[index + 1];

  if (!value || value.startsWith("-")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function parseArgs(args: string[]): CliOptions {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(packageJson.version);
    process.exit(0);
  }

  const url = args.find((arg) => !arg.startsWith("-"));

  if (!url) {
    printHelp();
    process.exit(1);
  }

  const headers: Record<string, string> = {};

  let method: HttpMethod = "GET";
  let body: string | undefined;
  let prettyPrint = false;
  let showHeaders = false;
  let showBody = false;
  let timing = false;
  let verbose = false;
  let send: string | undefined;
  let interactive = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === undefined) {
      continue;
    }

    switch (arg) {
      case "-X":
      case "--method":
        method = getArgValue(args, i, arg).toUpperCase() as HttpMethod;
        i++;
        break;

      case "-H":
      case "--header": {
        const value = getArgValue(args, i, arg);
        const [key, headerValue] = parseHeader(value);

        headers[key] = headerValue;

        i++;
        break;
      }

      case "-d":
      case "--data":
        body = getArgValue(args, i, arg);
        i++;
        break;

      case "--pretty-print":
        prettyPrint = true;
        break;

      case "--headers":
        showHeaders = true;
        break;

      case "--body":
        showBody = true;
        break;

      case "--timing":
        timing = true;
        break;

      case "--verbose":
        verbose = true;
        break;

      case "--send":
        send = getArgValue(args, i, arg);
        i++;
        break;

      case "--interactive":
        interactive = true;
        break;

      case "-v":
      case "--version":
      case "-h":
      case "--help":
        break;

      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}`);
        }
    }
  }

  return {
    url,
    method,
    headers,
    body,
    prettyPrint,
    showHeaders,
    showBody,
    timing,
    verbose,
    websocket:
      url.startsWith("ws://") ||
      url.startsWith("wss://"),
    send,
    interactive
  };
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));

    if (options.websocket) {
      await connectWebSocket({
        url: options.url,
        headers: options.headers,
        send: options.send,
        interactive: options.interactive,
        prettyPrint: options.prettyPrint
      });

      return;
    }

    const result = await request(options);

    printHttpResult(
      result.response,
      result.body,
      result.duration,
      {
        prettyPrint: options.prettyPrint,
        showHeaders: options.showHeaders,
        showBody: options.showBody,
        timing: options.timing,
        verbose: options.verbose
      }
    );
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

await main();