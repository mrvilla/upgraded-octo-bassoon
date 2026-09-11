import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  isAlias,
  isFigmaToken,
  type DtcgGroup,
  type DtcgToken,
  type FigmaCollection,
  type FigmaExport,
  type FigmaToken,
} from "./figma-token-types.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXPORT_PATH = join(ROOT, "figma", "export.json");
const TOKENS_ROOT = join(ROOT, "tokens");
const REM_GROUPS = new Set(["font-size", "spacing", "radius"]);

export function pxToRem(px: number): number {
  return Number((px / 16).toFixed(6));
}

function rewriteAlias(value: string, collectionName: string | undefined, tokenPath: string): string {
  if (!collectionName) {
    throw new Error(`Alias ${value} at ${tokenPath} is missing $collectionName`);
  }

  const inner = value.slice(1, -1);

  if (collectionName === "Primitives" || collectionName === "Semantics") {
    return `{color.${inner}}`;
  }

  throw new Error(`Cannot rewrite alias ${value} at ${tokenPath} from collection ${collectionName}`);
}

function withDescription(token: FigmaToken, converted: DtcgToken): DtcgToken {
  if (token.$description) {
    converted.$description = token.$description;
  }
  return converted;
}

function figmaExtensionValue(original: unknown): { value: unknown; wasAlias?: true } {
  // Style Dictionary resolves `{...}` in every string, including $extensions.
  // Store alias paths without braces so original Figma refs stay traceable.
  if (isAlias(original)) {
    return { value: original.slice(1, -1), wasAlias: true };
  }
  return { value: original };
}

function convertColorToken(token: FigmaToken, collection: string, mode: string, tokenPath: string): DtcgToken {
  const original = token.$value;
  return withDescription(token, {
    $type: "color",
    $value: isAlias(original) ? rewriteAlias(original, token.$collectionName, tokenPath) : original,
    $extensions: {
      figma: {
        collection,
        mode,
        scopes: token.$scopes ?? [],
        ...figmaExtensionValue(original),
      },
    },
  });
}

function convertDimensionToken(
  token: FigmaToken,
  collection: string,
  mode: string,
  group: string,
  leaf: string,
  tokenPath: string,
): DtcgToken {
  if (typeof token.$value !== "number") {
    throw new Error(`Expected numeric Figma value at ${tokenPath}, got ${typeof token.$value}`);
  }

  const original = token.$value;

  if (group === "opacity") {
    return withDescription(token, {
      $type: "number",
      $value: original,
      $extensions: {
        figma: {
          collection,
          mode,
          scopes: token.$scopes ?? [],
          value: original,
        },
      },
    });
  }

  const figma = {
    collection,
    mode,
    scopes: token.$scopes ?? [],
    value: original,
    unit: "px" as const,
  };

  if (group === "radius" && leaf === "full") {
    return withDescription(token, {
      $type: "dimension",
      $value: { value: original, unit: "px" },
      $extensions: { figma },
    });
  }

  if (REM_GROUPS.has(group)) {
    return withDescription(token, {
      $type: "dimension",
      $value: { value: pxToRem(original), unit: "rem" },
      $extensions: { figma },
    });
  }

  if (group === "border-width") {
    return withDescription(token, {
      $type: "dimension",
      $value: { value: original, unit: "px" },
      $extensions: { figma },
    });
  }

  throw new Error(`Unknown Dimensions group "${group}" at ${tokenPath}`);
}

function convertTree(
  node: unknown,
  collection: string,
  mode: string,
  path: string[],
  kind: "color" | "dimension",
): DtcgGroup | DtcgToken {
  if (isFigmaToken(node)) {
    if (node.$type === "color") {
      if (kind !== "color") {
        throw new Error(`Unexpected color token at ${path.join(".")}`);
      }
      return convertColorToken(node, collection, mode, path.join("."));
    }

    if (node.$type === "float") {
      if (kind !== "dimension") {
        throw new Error(`Unexpected float token at ${path.join(".")}`);
      }
      const group = path[0];
      const leaf = path[path.length - 1];
      if (!group || !leaf) {
        throw new Error(`Dimension token is missing path segments at ${path.join(".")}`);
      }
      return convertDimensionToken(node, collection, mode, group, leaf, path.join("."));
    }

    throw new Error(`Unsupported Figma $type "${node.$type}" at ${path.join(".")}`);
  }

  if (typeof node !== "object" || node === null) {
    throw new Error(`Unexpected non-object at ${path.join(".")}`);
  }

  const out: DtcgGroup = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = convertTree(value, collection, mode, [...path, key], kind);
  }
  return out;
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function resetGeneratedTokenDirs(): void {
  for (const dir of ["primitive", "dimension", "semantic", "component"]) {
    rmSync(join(TOKENS_ROOT, dir), { recursive: true, force: true });
  }
}

function collectionByName(data: FigmaExport, name: string): FigmaCollection {
  const found = data.find((item) => Object.prototype.hasOwnProperty.call(item, name));
  if (!found) {
    throw new Error(`Figma export is missing collection ${name}`);
  }
  return found[name];
}

export function convertFigmaExport(data: FigmaExport): void {
  resetGeneratedTokenDirs();

  const primitives = collectionByName(data, "Primitives");
  const semantics = collectionByName(data, "Semantics");
  const components = collectionByName(data, "Components");
  const dimensions = collectionByName(data, "Dimensions");

  const primitiveDefault = primitives.modes.Default;
  if (!primitiveDefault) {
    throw new Error("Primitives collection is missing Default mode");
  }
  writeJson(join(TOKENS_ROOT, "primitive", "color.json"), {
    color: convertTree(primitiveDefault, "Primitives", "Default", [], "color"),
  });

  for (const mode of ["Light", "Dark"] as const) {
    const semanticMode = semantics.modes[mode];
    if (!semanticMode) {
      throw new Error(`Semantics collection is missing ${mode} mode`);
    }
    writeJson(join(TOKENS_ROOT, "semantic", `${mode.toLowerCase()}.json`), {
      color: convertTree(semanticMode, "Semantics", mode, [], "color"),
    });

    const componentMode = components.modes[mode];
    if (!componentMode) {
      throw new Error(`Components collection is missing ${mode} mode`);
    }
    writeJson(
      join(TOKENS_ROOT, "component", `${mode.toLowerCase()}.json`),
      convertTree(componentMode, "Components", mode, [], "color"),
    );
  }

  const dimensionDefault = dimensions.modes.Default;
  if (!dimensionDefault) {
    throw new Error("Dimensions collection is missing Default mode");
  }

  for (const [group, tree] of Object.entries(dimensionDefault)) {
    writeJson(join(TOKENS_ROOT, "dimension", `${group}.json`), {
      [group]: convertTree(tree, "Dimensions", "Default", [group], "dimension"),
    });
  }
}

function main(): void {
  const data = JSON.parse(readFileSync(EXPORT_PATH, "utf8")) as FigmaExport;
  convertFigmaExport(data);
  console.log(`Converted ${EXPORT_PATH} → ${TOKENS_ROOT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
