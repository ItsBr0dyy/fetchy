import { $ } from "bun";
import { mkdir } from "node:fs/promises";

const targets = [
  {
    name: "fetchy-linux-x64",
    target: "bun-linux-x64",
  },
  {
    name: "fetchy-linux-arm64",
    target: "bun-linux-arm64",
  },
  {
    name: "fetchy-windows-x64.exe",
    target: "bun-windows-x64",
  },
  {
    name: "fetchy-macos-x64",
    target: "bun-darwin-x64",
  },
  {
    name: "fetchy-macos-arm64",
    target: "bun-darwin-arm64",
  },
] as const;

await mkdir("dist", { recursive: true });

console.log("Building fetchy\n");

for (const target of targets) {
  const output = `dist/${target.name}`;

  console.log(`→ ${target.name}`);

  await $`bun build ./src/index.ts --compile --target=${target.target} --outfile=${output}`;

  console.log(`${output}\n`);
}

console.log("Done");