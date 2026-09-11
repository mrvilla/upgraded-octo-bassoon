import { colorCatalog } from "../data/colorCatalog.ts";
import { ColorSwatch } from "./ColorSwatch.tsx";
import { SemanticPair } from "./SemanticPair.tsx";
import { DocsThemeSync } from "./DocsThemeSync.tsx";
import type { SemanticColor } from "../data/colorCatalog.types.ts";

function semanticExtraItems(token: SemanticColor) {
  return [
    { label: "Light alias", value: token.lightAlias },
    { label: "Dark alias", value: token.darkAlias },
    { label: "Light value", value: token.lightValue },
    { label: "Dark value", value: token.darkValue },
  ];
}

function SemanticGroup({ title, tokens }: { title: string; tokens: SemanticColor[] }) {
  if (tokens.length === 0) {
    return null;
  }

  return (
    <section className="mb-8" aria-labelledby={`${title}-heading`}>
      <h3 id={`${title}-heading`} className="text-lg">
        {title}
      </h3>
      <div className="flex flex-wrap gap-4">
        {tokens.map((token) => (
          <ColorSwatch
            key={token.name}
            path={token.name}
            cssVar={token.cssVar}
            background={`var(${token.cssVar})`}
            extraItems={semanticExtraItems(token)}
            label={`${token.name} ${token.cssVar}. Light ${token.lightAlias} ${token.lightValue}. Dark ${token.darkAlias} ${token.darkValue}.`}
          />
        ))}
      </div>
    </section>
  );
}

export function SemanticCatalog() {
  return (
    <DocsThemeSync>
      <div>
        <section className="mb-8" aria-labelledby="pairs-heading">
          <h3 id="pairs-heading" className="text-lg">
            Foreground and background pairs
          </h3>
          {colorCatalog.semantic.pairs.map((pair) => (
            <SemanticPair key={pair.background.name} pair={pair} />
          ))}
        </section>
        <SemanticGroup title="Border, input, and ring" tokens={colorCatalog.semantic.chrome} />
        <SemanticGroup title="Hover" tokens={colorCatalog.semantic.hover} />
        <SemanticGroup title="Disabled" tokens={colorCatalog.semantic.disabled} />
        <SemanticGroup title="Chart" tokens={colorCatalog.semantic.chart} />
      </div>
    </DocsThemeSync>
  );
}
