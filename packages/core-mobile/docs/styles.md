# Styling Conventions

Visual / design conventions for the Core Mobile app. Imported into `packages/core-mobile/CLAUDE.md` via `@docs/styles.md`, so these rules are always in context.

## Fonts: never use `fontWeight` to make Inter text thicker — use the `fontFamily` variant

The app uses the Inter typeface, which ships as separate named font files per weight. React Native does **not** synthesize weights from a numeric `fontWeight` for these custom fonts reliably across platforms — setting `fontWeight: '500'` / `'600'` / `'700'` renders inconsistently (often as Regular on Android) and has caused repeated visual bugs.

**Rule:** To make text medium or semi-bold (or any non-regular weight), set `fontFamily` to the matching Inter variant instead of overriding `fontWeight`.

```ts
// ❌ Do NOT do this — fontWeight override on Inter text
style = { ...style, fontWeight: '500' }   // intended Medium
style = { ...style, fontWeight: '600' }   // intended Semi-Bold

// ✅ Do this — select the correct Inter font family
style = { ...style, fontFamily: 'Inter-Medium' }     // weight 500 / medium
style = { ...style, fontFamily: 'Inter-SemiBold' }   // weight 600 / semi-bold
style = { ...style, fontFamily: 'Inter-Bold' }       // weight 700 / bold
```

This applies anywhere a weight is being applied to Inter text (component styles, design-system overrides, inline `sx`/`style`). Do not introduce `fontWeight: '500'` or `fontWeight: '600'` to thicken text — pick the proper `Inter-*` family. Prefer the design-system text variants when one already encodes the intended weight rather than overriding either property by hand.
