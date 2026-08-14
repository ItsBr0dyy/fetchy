import { prettyJson } from "./formatter.ts";

interface WebSocketOptions {
  url: string;
  headers: Record<string, string>;
  send?: string;
  interactive: boolean;
  prettyPrint: boolean;
}

function formatMessage(
  message: string,
  prettyPrint: boolean
): string {
  if (!prettyPrint) {
    return message;
  }

  return prettyJson(message);
}

export function connectWebSocket(
  options: WebSocketOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log();
    console.log(`Connecting to ${options.url}...`);

    const socket = new WebSocket(options.url, {
      headers: options.headers
    });

    let opened = false;

    socket.addEventListener("open", () => {
      opened = true;

      console.log();
      console.log(`● Connected to ${options.url}`);

      if (options.send) {
        socket.send(options.send);
        console.log(`→ ${formatMessage(options.send, options.prettyPrint)}`);
      }

      if (!options.interactive) {
        console.log();
        console.log("Listening for messages...");
      } else {
        console.log();
        console.log("Type a message and press Enter.");
        console.log("Press Ctrl+C to exit.");

        startInteractiveInput(socket, options.prettyPrint);
      }
    });

    socket.addEventListener("message", (event) => {
      const message =
        typeof event.data === "string"
          ? event.data
          : String(event.data);

      console.log();
      console.log(`← ${formatMessage(message, options.prettyPrint)}`);
    });

    socket.addEventListener("error", () => {
      const error = new Error("WebSocket connection failed.");

      if (!opened) {
        reject(error);
      } else {
        console.error(error.message);
      }
    });

    socket.addEventListener("close", (event) => {
      console.log();
      console.log(
        `● Connection closed (${event.code}${
          event.reason ? `: ${event.reason}` : ""
        })`
      );

      resolve();
    });
  });
}

function startInteractiveInput(
  socket: WebSocket,
  prettyPrint: boolean
): void {
  const stdin = process.stdin;

  stdin.setEncoding("utf8");
  stdin.resume();

  let buffer = "";

  stdin.on("data", (chunk: string) => {
    buffer += chunk;

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const message = line.trim();

      if (!message) {
        continue;
      }

      if (message === "/exit" || message === "/quit") {
        socket.close();
        stdin.pause();
        return;
      }

      socket.send(message);

      console.log(
        `→ ${formatMessage(message, prettyPrint)}`
      );
    }
  });
}