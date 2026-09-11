import type { PrimitivePalette } from "../data/colorCatalog.types.ts";
import { ColorSwatch } from "./ColorSwatch.tsx";

export function ColorScale({ palette }: { palette: PrimitivePalette }) {
  return (
    <section className="grid gap-3 mb-8" aria-labelledby={`${palette.name}-heading`}>
      <h3 id={`${palette.name}-heading`} className="text-lg m-0 capitalize">
        {palette.name}
      </h3>
      <div className="flex flex-wrap gap-4">
        {palette.swatches.map((swatch) => (
          <ColorSwatch
            key={swatch.path}
            path={swatch.path.replace(/^color\./, "")}
            cssVar={swatch.cssVar}
            resolvedValue={swatch.value}
            background={swatch.value}
            label={`${swatch.path} ${swatch.cssVar} ${swatch.value}`}
          />
        ))}
      </div>
    </section>
  );
}
