import { colorCatalog } from "../data/colorCatalog.ts";
import { ColorScale } from "./ColorScale.tsx";
import { DocsThemeSync } from "./DocsThemeSync.tsx";

export function PrimitiveCatalog() {
  return (
    <DocsThemeSync>
      <div className="grid gap-2">
        {colorCatalog.primitives.map((palette) => (
          <ColorScale key={palette.name} palette={palette} />
        ))}
      </div>
    </DocsThemeSync>
  );
}
