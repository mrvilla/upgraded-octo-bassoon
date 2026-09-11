import type { ColorCatalog } from "./colorCatalog.types.ts";
import catalog from "../generated/color-catalog.json";

export const colorCatalog = catalog as ColorCatalog;
