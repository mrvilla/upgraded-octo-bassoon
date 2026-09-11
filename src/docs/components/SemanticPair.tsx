import type { SemanticPair } from "../data/colorCatalog.types.ts";
import { TokenMeta } from "./TokenMeta.tsx";

export function SemanticPair({ pair }: { pair: SemanticPair }) {
  const sampleLabel = `${pair.background.name} background with ${pair.foreground.name} text`;

  return (
    <article className="grid gap-3 mb-6">
      <div
        className="rounded-md border border-border p-4"
        style={{
          background: `var(${pair.background.cssVar})`,
          color: `var(${pair.foreground.cssVar})`,
        }}
      >
        <p className="m-0 text-sm font-medium">{sampleLabel}</p>
        <p className="m-0 mt-1 text-sm">The quick brown fox jumps over the lazy dog.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TokenMeta
          items={[
            { label: "Semantic token", value: pair.background.name },
            { label: "CSS variable", value: pair.background.cssVar },
            { label: "Light alias", value: pair.background.lightAlias },
            { label: "Dark alias", value: pair.background.darkAlias },
            { label: "Light value", value: pair.background.lightValue },
            { label: "Dark value", value: pair.background.darkValue },
          ]}
        />
        <TokenMeta
          items={[
            { label: "Semantic token", value: pair.foreground.name },
            { label: "CSS variable", value: pair.foreground.cssVar },
            { label: "Light alias", value: pair.foreground.lightAlias },
            { label: "Dark alias", value: pair.foreground.darkAlias },
            { label: "Light value", value: pair.foreground.lightValue },
            { label: "Dark value", value: pair.foreground.darkValue },
          ]}
        />
      </div>
    </article>
  );
}
