import { colorCatalog } from "../data/colorCatalog.ts";
import { ColorSwatch } from "./ColorSwatch.tsx";
import { DocsThemeSync } from "./DocsThemeSync.tsx";
import type { ComponentColor } from "../data/colorCatalog.types.ts";

function ComponentGroup({ title, tokens }: { title: string; tokens: ComponentColor[] }) {
  return (
    <section className="mb-8" aria-labelledby={`${title}-heading`}>
      <h3 id={`${title}-heading`} className="text-lg capitalize">
        {title}
      </h3>
      <div className="flex flex-wrap gap-6">
        {tokens.map((token) => (
          <ColorSwatch
            key={token.path}
            path={token.path}
            cssVar={token.cssVar}
            background={`var(${token.cssVar})`}
            extraItems={[
              {
                label: "Referenced semantic token",
                value: token.semanticRef ? `→ ${token.semanticRef}` : "raw value (not a semantic alias)",
              },
              { label: "Light value", value: token.lightValue },
              { label: "Dark value", value: token.darkValue },
            ]}
            label={`${token.path} ${token.cssVar} ${token.semanticRef ?? token.rawValue ?? "active theme color"}. Light ${token.lightValue}. Dark ${token.darkValue}.`}
          />
        ))}
      </div>
    </section>
  );
}

export function ComponentCatalog() {
  return (
    <DocsThemeSync>
      <div>
        <ComponentGroup title="Button" tokens={colorCatalog.components.button} />
        <ComponentGroup title="Alert" tokens={colorCatalog.components.alert} />
      </div>
    </DocsThemeSync>
  );
}
