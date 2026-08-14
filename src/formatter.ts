const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

export function colorStatus(status: number): string {
  if (status >= 200 && status < 300) {
    return `${GREEN}${status}${RESET}`;
  }

  if (status >= 300 && status < 400) {
    return `${YELLOW}${status}${RESET}`;
  }

  return `${RED}${status}${RESET}`;
}

export function isJson(contentType: string | null, body: string): boolean {
  if (contentType?.includes("application/json")) {
    return true;
  }

  const trimmed = body.trim();

  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
}

export function prettyJson(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export function formatHeaders(headers: Headers): string {
  const entries = [...headers.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return entries
    .map(([key, value]) => `${DIM}${key}:${RESET} ${value}`)
    .join("\n");
}

export function printHttpResult(
  response: Response,
  body: string,
  duration: number,
  options: {
    prettyPrint: boolean;
    showHeaders: boolean;
    showBody: boolean;
    timing: boolean;
    verbose: boolean;
  }
): void {
  console.log();

  console.log(
    `${BOLD}${response.url}${RESET}`
  );

  console.log(
    `${colorStatus(response.status)} ${response.statusText}`
  );

  if (options.showHeaders || options.verbose) {
    console.log();
    console.log(`${BOLD}Headers${RESET}`);
    console.log(formatHeaders(response.headers));
  }

  if (options.showBody || options.verbose || !options.showHeaders) {
    console.log();
    console.log(`${BOLD}Body${RESET}`);
    console.log("────────────────────────────────────────");

    const output =
      options.prettyPrint &&
      isJson(response.headers.get("content-type"), body)
        ? prettyJson(body)
        : body;

    console.log(output || `${DIM}(empty response)${RESET}`);
  }

  if (options.timing || options.verbose) {
    console.log();
    console.log(`${DIM}Completed in ${duration.toFixed(2)}ms${RESET}`);
  }

  console.log();
}

export function printError(error: unknown): void {
  const message =
    error instanceof Error ? error.message : String(error);

  console.error(`${RED}${BOLD}fetchy error:${RESET} ${message}`);
}