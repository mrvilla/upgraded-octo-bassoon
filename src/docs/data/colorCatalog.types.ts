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
