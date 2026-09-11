import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { convertFigmaExport } from "./convert-figma-tokens.ts";
import { buildTokens } from "./build-tokens.ts";
import { validateTokens } from "./validate-tokens.ts";
import type { FigmaExport } from "./figma-token-types.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TRACKED_DIRS = ["tokens/primitive", "tokens/dimension", "tokens/semantic", "tokens/component", "src/styles/generated"];

function listFiles(dir: string): string[] {
  const abs = join(ROOT, dir);
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const next = join(current, entry);
      if (statSync(next).isDirectory()) {
        walk(next);
      } else {
        out.push(relative(ROOT, next));
      }
    }
  };
  walk(abs);
  return out.sort();
}

function snapshot(): string {
  const hash = createHash("sha256");
  for (const dir of TRACKED_DIRS) {
    for (const file of listFiles(dir)) {
      hash.update(file);
      hash.update("\0");
      hash.update(readFileSync(join(ROOT, file)));
      hash.update("\0");
    }
  }
  return hash.digest("hex");
}

function convertFromExport(): void {
  const data = JSON.parse(readFileSync(join(ROOT, "figma/export.json"), "utf8")) as FigmaExport;
  convertFigmaExport(data);
}

export async function checkGenerated(): Promise<void> {
  const before = snapshot();
  convertFromExport();
  await buildTokens();
  const after = snapshot();

  if (before !== after) {
    throw new Error(
      "Generated files are stale. Run `pnpm tokens:convert` and `pnpm tokens:build`, then commit the result.",
    );
  }

  convertFromExport();
  await buildTokens();
  const rebuilt = snapshot();
  if (after !== rebuilt) {
    throw new Error("Conversion and token build are not deterministic; generated files changed on rebuild.");
  }

  validateTokens();
  console.log("Generated files are fresh and deterministic.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkGenerated();
}
