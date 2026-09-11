import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_ROOT = join(ROOT, "tokens");
const OUTPUT_PATH = join(ROOT, "src/docs/generated/color-catalog.json");

const PALETTE_ORDER = [
  "zinc",
  "gray",
  "blue",
  "red",
  "green",
  "emerald",
  "amber",
  "orange",
  "sky",
  "black",
  "white",
] as const;

const SEMANTIC_PAIRS = [
  ["background", "foreground"],
  ["card", "card-foreground"],
  ["popover", "popover-foreground"],
  ["primary", "primary-foreground"],
  ["secondary", "secondary-foreground"],
  ["muted", "muted-foreground"],
  ["accent", "accent-foreground"],
  ["destructive", "destructive-foreground"],
  ["success", "success-foreground"],
  ["warning", "warning-foreground"],
  ["info", "info-foreground"],
] as const;

type TokenNode = {
  $type?: string;
  $value?: unknown;
  [key: string]: unknown;
};

export type PrimitiveSwatch = {
  path: string;
  cssVar: string;
  value: string;
};

export type PrimitivePalette = {
  name: string;
  swatches: PrimitiveSwatch[];
};

export type SemanticColor = {
  name: string;
  cssVar: string;
  lightAlias: string;
  darkAlias: string;
  lightValue: string;
  darkValue: string;
};

export type SemanticPair = {
  background: SemanticColor;
  foreground: SemanticColor;
};

export type ComponentColor = {
  path: string;
  cssVar: string;
  semanticRef: string | null;
  rawValue: string | null;
  lightValue: string;
  darkValue: string;
};

export type ColorCatalog = {
  $comment: string;
  primitives: PrimitivePalette[];
  semantic: {
    pairs: SemanticPair[];
    chrome: SemanticColor[];
    hover: SemanticColor[];
    disabled: SemanticColor[];
    chart: SemanticColor[];
  };
  components: {
    button: ComponentColor[];
    alert: ComponentColor[];
  };
};

function readJson(relativePath: string): TokenNode {
  return JSON.parse(readFileSync(join(TOKENS_ROOT, relativePath), "utf8")) as TokenNode;
}

function isToken(node: unknown): node is TokenNode {
  return typeof node === "object" && node !== null && "$value" in node;
}

function aliasPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("{") || !value.endsWith("}")) {
    return null;
  }
  return value.slice(1, -1);
}

function getByPath(tree: TokenNode, path: string[]): unknown {
  let current: unknown = tree;
  for (const segment of path) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      throw new Error(`Missing token path ${path.join(".")}`);
    }
    current = (current as TokenNode)[segment];
  }
  return current;
}

function primitiveValue(primitives: TokenNode, colorPath: string): string {
  const parts = colorPath.split(".");
  const token = getByPath(primitives, parts);
  if (!isToken(token) || typeof token.$value !== "string") {
    throw new Error(`Primitive ${colorPath} is not a color value`);
  }
  return token.$value;
}

function resolveColor(primitives: TokenNode, semantics: TokenNode | null, value: unknown): string {
  const alias = aliasPath(value);
  if (!alias) {
    if (typeof value !== "string") {
      throw new Error("Expected a color string");
    }
    return value;
  }

  const parts = alias.split(".");
  if (parts[0] === "color" && parts.length === 2 && parts[1] && semantics) {
    const colorRoot = semantics.color;
    if (typeof colorRoot === "object" && colorRoot !== null && parts[1] in colorRoot) {
      const semanticToken = (colorRoot as TokenNode)[parts[1]];
      if (isToken(semanticToken)) {
        return resolveColor(primitives, null, semanticToken.$value);
      }
    }
  }

  return primitiveValue(primitives, alias);
}

function walkTokens(node: TokenNode, path: string[]): Array<{ path: string[]; token: TokenNode }> {
  if (isToken(node)) {
    return [{ path, token: node }];
  }

  const out: Array<{ path: string[]; token: TokenNode }> = [];
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$") || typeof value !== "object" || value === null) {
      continue;
    }
    out.push(...walkTokens(value as TokenNode, [...path, key]));
  }
  return out;
}

function displayAlias(value: unknown): string {
  return aliasPath(value) ?? String(value);
}

function buildPrimitives(primitives: TokenNode): PrimitivePalette[] {
  const colorRoot = primitives.color;
  if (typeof colorRoot !== "object" || colorRoot === null) {
    throw new Error("Primitive color group is missing");
  }

  const palettes = new Map<string, PrimitiveSwatch[]>();
  for (const { path, token } of walkTokens(colorRoot as TokenNode, ["color"])) {
    const palette = path[1];
    if (!palette || typeof token.$value !== "string") {
      continue;
    }
    const list = palettes.get(palette) ?? [];
    list.push({
      path: path.join("."),
      cssVar: `--primitive-${path.join("-")}`,
      value: token.$value,
    });
    palettes.set(palette, list);
  }

  const ordered = PALETTE_ORDER.map((name) => {
    const swatches = palettes.get(name);
    if (!swatches) {
      throw new Error(`Missing primitive palette ${name}`);
    }
    palettes.delete(name);
    return { name, swatches };
  });

  if (palettes.size > 0) {
    throw new Error(`Unexpected primitive palettes: ${[...palettes.keys()].join(", ")}`);
  }

  return ordered;
}

function semanticColor(name: string, light: TokenNode, dark: TokenNode, primitives: TokenNode): SemanticColor {
  const lightToken = getByPath(light, ["color", name]);
  const darkToken = getByPath(dark, ["color", name]);
  if (!isToken(lightToken) || !isToken(darkToken)) {
    throw new Error(`Missing semantic color ${name}`);
  }

  return {
    name,
    cssVar: `--ds-color-${name}`,
    lightAlias: displayAlias(lightToken.$value),
    darkAlias: displayAlias(darkToken.$value),
    lightValue: resolveColor(primitives, null, lightToken.$value),
    darkValue: resolveColor(primitives, null, darkToken.$value),
  };
}

function buildComponents(
  lightTree: TokenNode,
  darkTree: TokenNode,
  primitives: TokenNode,
  lightSemantics: TokenNode,
  darkSemantics: TokenNode,
): { button: ComponentColor[]; alert: ComponentColor[] } {
  const button: ComponentColor[] = [];
  const alert: ComponentColor[] = [];
  const darkTokens = new Map(
    walkTokens(darkTree, []).map(({ path, token }) => [path.join("."), token] as const),
  );

  for (const { path, token } of walkTokens(lightTree, [])) {
    const group = path[0] === "button" ? button : path[0] === "alert" ? alert : null;
    if (!group) {
      throw new Error(`Unexpected component group ${path.join(".")}`);
    }

    const joined = path.join(".");
    const darkToken = darkTokens.get(joined);
    if (!darkToken) {
      throw new Error(`Component token ${joined} is missing from the Dark file`);
    }

    const alias = aliasPath(token.$value);
    group.push({
      path: joined,
      cssVar: `--ds-${path.join("-")}`,
      semanticRef: alias,
      rawValue: alias ? null : typeof token.$value === "string" ? token.$value : null,
      lightValue: resolveColor(primitives, lightSemantics, token.$value),
      darkValue: resolveColor(primitives, darkSemantics, darkToken.$value),
    });
    darkTokens.delete(joined);
  }

  if (darkTokens.size > 0) {
    throw new Error(`Dark-only component tokens: ${[...darkTokens.keys()].join(", ")}`);
  }

  return { button, alert };
}

export function buildColorCatalog(): ColorCatalog {
  const primitives = readJson("primitive/color.json");
  const light = readJson("semantic/light.json");
  const dark = readJson("semantic/dark.json");
  const componentsLight = readJson("component/light.json");
  const componentsDark = readJson("component/dark.json");

  const named = (names: string[]) => names.map((name) => semanticColor(name, light, dark, primitives));
  const used = new Set<string>(SEMANTIC_PAIRS.flat());

  const pairs = SEMANTIC_PAIRS.map(([background, foreground]) => ({
    background: semanticColor(background, light, dark, primitives),
    foreground: semanticColor(foreground, light, dark, primitives),
  }));

  const colorRoot = light.color;
  if (typeof colorRoot !== "object" || colorRoot === null) {
    throw new Error("Semantic color group is missing");
  }
  const remaining = Object.keys(colorRoot).filter((name) => !used.has(name));

  const chrome = named(remaining.filter((name) => ["border", "input", "ring"].includes(name)));
  const hover = named(remaining.filter((name) => name.endsWith("-hover")));
  const disabled = named(remaining.filter((name) => name.startsWith("disabled")));
  const chart = named(remaining.filter((name) => name.startsWith("chart-")));
  const leftover = remaining.filter(
    (name) =>
      !["border", "input", "ring"].includes(name) &&
      !name.endsWith("-hover") &&
      !name.startsWith("disabled") &&
      !name.startsWith("chart-"),
  );
  if (leftover.length > 0) {
    throw new Error(`Unclassified semantic colors: ${leftover.join(", ")}`);
  }

  return {
    $comment: "Generated from tokens/. Do not edit.",
    primitives: buildPrimitives(primitives),
    semantic: { pairs, chrome, hover, disabled, chart },
    components: buildComponents(componentsLight, componentsDark, primitives, light, dark),
  };
}

export function writeColorCatalog(): void {
  const catalog = buildColorCatalog();
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
}
