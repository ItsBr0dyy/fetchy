import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { FetchyConfig } from "./types";

const configDirectory = join(
    homedir(),
    ".config",
    "fetchy",
);

const configPath = join(
    configDirectory,
    "config.json",
);

export const defaultConfig: FetchyConfig = {
    prettyPrint: false,
    showHeaders: false,
    showBody: false,
    timing: false,
    verbose: false,
    follow: false,
};

export async function loadConfig(): Promise<FetchyConfig> {
    try {
        const contents = await readFile(
            configPath,
            "utf8",
        );

        const parsed = JSON.parse(contents);

        return {
            ...defaultConfig,
            ...parsed,
        };
    } catch {
        return {
            ...defaultConfig,
        };
    }
}

export async function saveConfig(
    config: FetchyConfig,
): Promise<void> {
    await mkdir(configDirectory, {
        recursive: true,
    });

    await writeFile(
        configPath,
        JSON.stringify(config, null, 2) + "\n",
        "utf8",
    );
}

export async function resetConfig(): Promise<void> {
    try {
        await rm(configPath);
    } catch {

    }
}

export function getConfigPath(): string {
    return configPath;
}