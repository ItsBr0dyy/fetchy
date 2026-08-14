import type { CliOptions, HttpResult } from "./types";

export async function request(
    options: CliOptions
): Promise<HttpResult> {
    const start = performance.now();

    const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.method === "GET" || options.method === "HEAD"
            ? undefined
            : options.body
    });

    const body = await response.text();

    const duration = performance.now() - start;

    return {
        response,
        body,
        duration
    };
}