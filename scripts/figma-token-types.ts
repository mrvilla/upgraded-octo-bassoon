export type FigmaToken = {
  $value: unknown;
  $type: string;
  $scopes?: string[];
  $description?: string;
  $libraryName?: string;
  $collectionName?: string;
};

export type FigmaCollection = {
  modes: Record<string, Record<string, unknown>>;
};

export type FigmaExport = Array<Record<string, FigmaCollection>>;

export type FigmaExtensions = {
  collection: string;
  mode: string;
  scopes: string[];
  value: unknown;
  unit?: "px";
  wasAlias?: true;
};

export type DtcgToken = {
  $type: string;
  $value: unknown;
  $description?: string;
  $extensions: {
    figma: FigmaExtensions;
  };
};

export type DtcgGroup = {
  [key: string]: DtcgToken | DtcgGroup;
};

export function isFigmaToken(value: unknown): value is FigmaToken {
  return typeof value === "object" && value !== null && "$value" in value;
}

export function isAlias(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("{") && value.endsWith("}");
}
