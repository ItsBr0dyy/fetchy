import { request } from "./http.ts";
import { connectWebSocket } from "./websocket.ts";
import {
  printError,
  printHttpResult,
} from "./formatter.ts";
import {
  getConfigPath,
  loadConfig,
  resetConfig,
  saveConfig,
} from "./config.ts";

import type {
  CliOptions,
  FetchyConfig,
  HttpMethod,
} from "./types.ts";

import packageJson from "../package.json";

function printHelp(): void {
  console.log(`
fetchy v${packageJson.version}

Usage:
  fetchy <url> [options]

HTTP:
  -X, --method <method>       HTTP method
  -H, --header <header>       Request header
  -d, --data <body>           Request body

Options:
      --pretty-print          Pretty-print JSON
      --headers               Show response headers
      --body                  Show response body
      --timing                Show request timing
      --verbose               Show everything
      --proxy <url>            Route request through a proxy
      --follow                 Follow redirects
      --save <name>            Save request

WebSocket:
      --send <message>        Send a WebSocket message
      --interactive           Interactive WebSocket mode

Configuration:
  fetchy config               Show configuration
  fetchy config show          Show configuration
  fetchy config path          Show config path
  fetchy config set <k> <v>   Set configuration value
  fetchy config reset         Reset configuration

Other:
  -v, --version               Show version
  -h, --help                  Show help
`);
}

function parseHeader(value: string): [string, string] {
  const separator = value.indexOf(":");

  if (separator === -1) {
    throw new Error(
      `Invalid header "${value}". Expected "Name: Value".`,
    );
  }

  const key = value.slice(0, separator).trim();
  const headerValue = value
    .slice(separator + 1)
    .trim();

  if (!key || !headerValue) {
    throw new Error(
      `Invalid header "${value}". Expected "Name: Value".`,
    );
  }

  return [key, headerValue];
}

function getArgValue(
  args: string[],
  index: number,
  flag: string,
): string {
  const value = args[index + 1];

  if (!value || value.startsWith("-")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function parseArgs(
  args: string[],
  config: FetchyConfig,
): CliOptions {
  if (
    args.includes("--help") ||
    args.includes("-h")
  ) {
    printHelp();
    process.exit(0);
  }

  if (
    args.includes("--version") ||
    args.includes("-v")
  ) {
    console.log(packageJson.version);
    process.exit(0);
  }

  const url = args.find(
    (arg) => !arg.startsWith("-"),
  );

  if (!url) {
    printHelp();
    process.exit(1);
  }

  const headers: Record<string, string> = {};

  let method: HttpMethod = "GET";
  let body: string | undefined;

  let prettyPrint = config.prettyPrint;
  let showHeaders = config.showHeaders;
  let showBody = config.showBody;
  let timing = config.timing;
  let verbose = config.verbose;
  let follow = config.follow;
  let proxy = config.proxy;

  let send: string | undefined;
  let interactive = false;
  let save: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === undefined) {
      continue;
    }

    switch (arg) {
      case "-X":
      case "--method":
        method =
          getArgValue(
            args,
            i,
            arg,
          ).toUpperCase() as HttpMethod;

        i++;
        break;

      case "-H":
      case "--header": {
        const value = getArgValue(
          args,
          i,
          arg,
        );

        const [key, headerValue] =
          parseHeader(value);

        headers[key] = headerValue;

        i++;
        break;
      }

      case "-d":
      case "--data":
        body = getArgValue(
          args,
          i,
          arg,
        );

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
        send = getArgValue(
          args,
          i,
          arg,
        );

        i++;
        break;

      case "--interactive":
        interactive = true;
        break;

      case "--proxy":
        proxy = getArgValue(
          args,
          i,
          arg,
        );

        i++;
        break;

      case "--follow":
        follow = true;
        break;

      case "--save":
        save = getArgValue(
          args,
          i,
          arg,
        );

        i++;
        break;

      case "-v":
      case "--version":
      case "-h":
      case "--help":
        break;

      default:
        if (arg.startsWith("-")) {
          throw new Error(
            `Unknown option: ${arg}`,
          );
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
    interactive,

    proxy,
    follow,
    save,
  };
}

async function handleConfigCommand(
  args: string[],
): Promise<void> {
  const command = args[1];

  switch (command) {
    case undefined:
    case "show": {
      const config = await loadConfig();

      console.log(
        JSON.stringify(
          config,
          null,
          2,
        ),
      );

      return;
    }

    case "path":
      console.log(getConfigPath());
      return;

    case "set": {
      const key = args[2];
      const value = args[3];

      if (!key || value === undefined) {
        throw new Error(
          "Usage: fetchy config set <key> <value>",
        );
      }

      const config = await loadConfig();

      if (
        key === "prettyPrint" ||
        key === "showHeaders" ||
        key === "showBody" ||
        key === "timing" ||
        key === "verbose" ||
        key === "follow"
      ) {
        if (
          value !== "true" &&
          value !== "false"
        ) {
          throw new Error(
            `${key} must be true or false.`,
          );
        }

        const enabled = value === "true";

        switch (key) {
          case "prettyPrint":
            config.prettyPrint = enabled;
            break;

          case "showHeaders":
            config.showHeaders = enabled;
            break;

          case "showBody":
            config.showBody = enabled;
            break;

          case "timing":
            config.timing = enabled;
            break;

          case "verbose":
            config.verbose = enabled;
            break;

          case "follow":
            config.follow = enabled;
            break;
        }

        await saveConfig(config);

        console.log(
          `Set ${key} = ${value}`,
        );

        return;
      }

      if (key === "proxy") {
        config.proxy = value;

        await saveConfig(config);

        console.log(
          `Set proxy = ${value}`,
        );

        return;
      }

      throw new Error(
        `Unknown config option: ${key}`,
      );
    }

    case "reset":
      await resetConfig();

      console.log(
        "Configuration reset.",
      );

      return;

    default:
      throw new Error(
        `Unknown config command: ${command}`,
      );
  }
}

async function main(): Promise<void> {
  try {
    const args =
      process.argv.slice(2);

    if (args[0] === "config") {
      await handleConfigCommand(args);
      return;
    }

    const config =
      await loadConfig();

    const options =
      parseArgs(args, config);

    if (options.websocket) {
      await connectWebSocket({
        url: options.url,
        headers: options.headers,
        send: options.send,
        interactive:
          options.interactive,
        prettyPrint:
          options.prettyPrint,
      });

      return;
    }

    const result =
      await request(options);

    printHttpResult(
      result.response,
      result.body,
      result.duration,
      {
        prettyPrint:
          options.prettyPrint,

        showHeaders:
          options.showHeaders,

        showBody:
          options.showBody,

        timing:
          options.timing,

        verbose:
          options.verbose,
      },
    );
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

await main();