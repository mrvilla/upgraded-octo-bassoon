import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { DtcgToken } from "./figma-token-types.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

function at(object: unknown, path: string[]): unknown {
  let current: unknown = object;
  for (const segment of path) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      throw new Error(`Missing path ${path.join(".")}`);
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function asToken(value: unknown, path: string): DtcgToken {
  if (typeof value !== "object" || value === null || !("$value" in value) || !("$type" in value)) {
    throw new Error(`${path} is not a DTCG token`);
  }
  return value as DtcgToken;
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    throw new Error(`${message}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  }
}

function assertClose(actual: number, expected: number, message: string): void {
  if (Math.abs(actual - expected) > 1e-9) {
    throw new Error(`${message}\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}

function assertMatch(content: string, pattern: RegExp, message: string): void {
  if (!pattern.test(content)) {
    throw new Error(message);
  }
}

function assertNoMatch(content: string, pattern: RegExp, message: string): void {
  if (pattern.test(content)) {
    throw new Error(message);
  }
}

export function validateTokens(): void {
  const fontSize = asToken(at(readJson("tokens/dimension/font-size.json"), ["font-size", "sm"]), "font-size.sm");
  assertEqual(fontSize.$value, { value: 0.875, unit: "rem" }, "font-size.sm DTCG value");
  assertEqual(fontSize.$extensions.figma.value, 14, "font-size.sm original Figma value");
  assertEqual(fontSize.$extensions.figma.unit, "px", "font-size.sm inferred px unit");

  const spacing = asToken(at(readJson("tokens/dimension/spacing.json"), ["spacing", "4"]), "spacing.4");
  assertEqual(spacing.$value, { value: 1, unit: "rem" }, "spacing.4 DTCG value");
  assertEqual(spacing.$extensions.figma.value, 16, "spacing.4 original Figma value");

  const radiusMd = asToken(at(readJson("tokens/dimension/radius.json"), ["radius", "md"]), "radius.md");
  assertEqual(radiusMd.$value, { value: 0.375, unit: "rem" }, "radius.md DTCG value");
  assertEqual(radiusMd.$extensions.figma.value, 6, "radius.md original Figma value");

  const radiusFull = asToken(at(readJson("tokens/dimension/radius.json"), ["radius", "full"]), "radius.full");
  assertEqual(radiusFull.$value, { value: 9999, unit: "px" }, "radius.full DTCG value");
  assertEqual(radiusFull.$extensions.figma.value, 9999, "radius.full original Figma value");
  assertEqual(radiusFull.$extensions.figma.unit, "px", "radius.full inferred px unit");

  const border = asToken(
    at(readJson("tokens/dimension/border-width.json"), ["border-width", "base"]),
    "border-width.base",
  );
  assertEqual(border.$value, { value: 1, unit: "px" }, "border-width.base DTCG value");
  assertEqual(border.$extensions.figma.value, 1, "border-width.base original Figma value");

  const opacity = asToken(at(readJson("tokens/dimension/opacity.json"), ["opacity", "50"]), "opacity.50");
  if (typeof opacity.$value !== "number") {
    throw new Error("opacity.50 $value is not a number");
  }
  assertClose(opacity.$value, 0.5, "opacity.50 DTCG value");
  assertClose(Number(opacity.$extensions.figma.value), 0.5, "opacity.50 original Figma value");

  const primary = asToken(at(readJson("tokens/semantic/light.json"), ["color", "primary"]), "color.primary");
  assertEqual(primary.$value, "{color.blue.600}", "semantic light primary alias");
  assertEqual(primary.$extensions.figma.value, "blue.600", "semantic light primary original alias path");
  assertEqual(primary.$extensions.figma.wasAlias, true, "semantic light primary was a Figma alias");

  const ghost = asToken(
    at(readJson("tokens/component/light.json"), ["button", "ghost", "background"]),
    "button.ghost.background",
  );
  assertEqual(ghost.$value, "rgba(0, 0, 0, 0)", "ghost background remains rgba");

  const css = readFileSync(join(ROOT, "src/styles/generated/tokens.css"), "utf8");
  const dark = readFileSync(join(ROOT, "src/styles/generated/tokens.dark.css"), "utf8");
  const theme = readFileSync(join(ROOT, "src/styles/generated/theme.css"), "utf8");

  assertMatch(css, /--ds-font-size-sm:\s*0\.875rem;/, "CSS font-size.sm");
  assertMatch(css, /--ds-spacing-4:\s*1rem;/, "CSS spacing.4");
  assertMatch(css, /--ds-radius-md:\s*0\.375rem;/, "CSS radius.md");
  assertMatch(css, /--ds-radius-full:\s*9999px;/, "CSS radius.full");
  assertMatch(css, /--ds-border-width-base:\s*1px;/, "CSS border-width.base");
  assertMatch(css, /--ds-opacity-50:\s*0\.5;/, "CSS opacity.50");
  assertMatch(css, /--primitive-color-blue-600:\s*#2563eb;/, "CSS primitive blue.600");
  assertMatch(css, /--ds-color-primary:\s*var\(--primitive-color-blue-600\);/, "CSS semantic primary references primitive");
  assertMatch(
    css,
    /--ds-button-default-background:\s*var\(--ds-color-primary\);/,
    "CSS component button references semantic",
  );

  assertMatch(dark, /\[data-theme="dark"\]/, "dark selector");
  assertMatch(dark, /--ds-color-primary:\s*var\(--primitive-color-blue-400\);/, "dark semantic primary");
  assertNoMatch(dark, /--primitive-color-[^:]+:\s*#/, "dark file should not redefine primitive values");
  assertNoMatch(dark, /--ds-button-/, "dark file should not redefine component tokens");

  assertMatch(theme, /--color-primary:\s*var\(--ds-color-primary\);/, "Tailwind semantic mapping");
  assertMatch(theme, /--text-sm:\s*var\(--ds-font-size-sm\);/, "Tailwind font-size mapping");
  assertMatch(theme, /--spacing-4:\s*var\(--ds-spacing-4\);/, "Tailwind spacing mapping");
  assertMatch(theme, /--radius-md:\s*var\(--ds-radius-md\);/, "Tailwind radius mapping");
  assertMatch(theme, /--border-width-base:\s*var\(--ds-border-width-base\);/, "Tailwind border-width mapping");
  assertNoMatch(theme, /--color-primary:\s*var\(--color-primary\);/, "no self-referencing Tailwind color vars");
  assertNoMatch(theme, /--color-zinc-/, "primitive palettes must not enter @theme");
  assertNoMatch(theme, /--color-blue-50:/, "primitive palettes must not enter @theme");

  const catalog = readJson("src/docs/generated/color-catalog.json") as {
    primitives: Array<{ name: string; swatches: unknown[] }>;
    semantic: {
      pairs: unknown[];
      chrome: unknown[];
      hover: unknown[];
      disabled: unknown[];
      chart: unknown[];
    };
    components: { button: unknown[]; alert: unknown[] };
  };
  const primitiveCount = catalog.primitives.reduce((sum, palette) => sum + palette.swatches.length, 0);
  assertEqual(primitiveCount, 101, "catalog primitive color count");
  assertEqual(catalog.primitives.map((palette) => palette.name).join(","), "zinc,gray,blue,red,green,emerald,amber,orange,sky,black,white", "catalog palette order");
  const semanticCount =
    catalog.semantic.pairs.length * 2 +
    catalog.semantic.chrome.length +
    catalog.semantic.hover.length +
    catalog.semantic.disabled.length +
    catalog.semantic.chart.length;
  assertEqual(semanticCount, 35, "catalog semantic color count");
  assertEqual(catalog.components.button.length + catalog.components.alert.length, 27, "catalog component color count");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateTokens();
  console.log("Token validation passed.");
}
