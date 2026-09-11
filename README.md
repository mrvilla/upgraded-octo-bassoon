# Design System Lab

An experiment in whether Figma variables, design tokens, AI coding agents, Storybook, and Chromatic can form a reliable design-to-code workflow.

## Current phase

Token architecture and design-system foundations. Chromatic is not installed yet. UI components are not implemented yet.

This milestone is reproducible from the committed `figma/export.json`. Conversion, CSS generation, Tailwind, Storybook, and CI do not call the Figma API, do not read a live Figma file, and do not require Figma credentials.

## Handoff

```text
Figma file
  → manual variable export
  → figma/export.json          (committed snapshot; do not edit)
  → tokens/**                  (normalized DTCG JSON)
  → src/styles/generated/**    (CSS custom properties)
  → Tailwind @theme inline
  → Storybook foundation docs
```

1. A person exports variables from the Figma file and replaces `figma/export.json`.
2. `pnpm tokens:convert` reads only that file and writes DTCG files under `tokens/`.
3. `pnpm tokens:build` validates references and emits CSS under `src/styles/generated/`.
4. Tailwind 4 maps runtime semantic and dimension variables through `@theme inline`.
5. Storybook documents the result. It does not fetch Figma.

## Future live Figma connection (out of scope)

A later milestone could replace the manual export step. It is not part of this pipeline. It would add:

- Figma authentication (personal access token or OAuth)
- Fetching variables from a file key / node rather than a committed JSON snapshot
- Detecting drift between the live file and `figma/export.json`
- Optionally writing a fresh export before convert
- Handling Figma-only metadata this dump does not include (variable IDs, library publishes)

Until that exists, CI and local builds must keep working from `figma/export.json` alone.

## CSS namespaces

| Layer | Runtime CSS | Tailwind `@theme` |
| --- | --- | --- |
| Primitive | `--primitive-color-blue-600` | not mapped |
| Semantic | `--ds-color-primary` | `--color-primary: var(--ds-color-primary)` |
| Component | `--ds-button-default-background` | not mapped |
| Font size | `--ds-font-size-sm` | `--text-sm: var(--ds-font-size-sm)` |
| Spacing | `--ds-spacing-4` | `--spacing-4: var(--ds-spacing-4)` |
| Radius | `--ds-radius-md` | `--radius-md: var(--ds-radius-md)` |
| Border width | `--ds-border-width-base` | `--border-width-base: var(--ds-border-width-base)` |
| Opacity | `--ds-opacity-50` | not mapped |

Do not create self-referencing theme variables such as `--color-primary: var(--color-primary)`.

Dark mode overrides only `--ds-color-*` under `[data-theme="dark"]`. Component tokens stay on `:root` as `var(--ds-color-*)` so they follow the semantic theme.

## Dimension conversion

Figma Dimensions values are unitless numbers. The converter stores structured DTCG dimensions:

| Group | Rule | Example |
| --- | --- | --- |
| font-size | px → rem, `16px = 1rem` | `font-size.sm`: 14 → `0.875rem` |
| spacing | px → rem, `16px = 1rem` | `spacing.4`: 16 → `1rem` |
| radius | px → rem, `16px = 1rem` | `radius.md`: 6 → `0.375rem` |
| radius.full | keep px | `9999` → `9999px` |
| border-width | keep px | `border-width.base`: 1 → `1px` |
| opacity | unitless number 0–1 | `opacity.50` ≈ 0.5 → `0.5` in CSS |

Original Figma numeric values, inferred px units, collection, mode, and scopes are stored in `$extensions.figma`. CSS rounds opacity to two decimal places; source JSON keeps the exported float.

Figma aliases are rewritten in `$value` (`{blue.600}` → `{color.blue.600}`). The original alias path is stored in `$extensions.figma.value` without braces, with `wasAlias: true`, because Style Dictionary resolves `{...}` in every string including extensions.

This export does not contain vw, vh, dvh, percentages, container units, fluid values, or `clamp()`. Those are out of scope until Figma represents them.

Token paths such as `spacing.0-5` are preserved. They become `--ds-spacing-0-5` and Tailwind `--spacing-0-5`, not Tailwind's `0.5` key.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm tokens:convert` | Convert `figma/export.json` → `tokens/` |
| `pnpm tokens:build` | Style Dictionary → `src/styles/generated/` |
| `pnpm tokens:validate` | Check representative DTCG and CSS values |
| `pnpm tokens:check` | Rebuild, assert determinism, then validate |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm dev` | Vite app |
| `pnpm build` | Production Vite build |
| `pnpm storybook` | Storybook foundation docs |
| `pnpm build-storybook` | Static Storybook |

Generated CSS is committed. Do not edit files under `src/styles/generated/`.
