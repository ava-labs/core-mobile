import { defineConfig } from 'i18next-cli'

// Extraction/types pipeline for the i18n string sweep (CP-14851).
// Options mirror the runtime init in app/i18n/index.ts so extracted keys
// match how i18next resolves them at runtime (flat natural-English keys,
// single `translation` namespace). See Specs design doc §3.
export default defineConfig({
  locales: [
    'en-US',
    'zh-CN',
    'zh-TW',
    'fr-FR',
    'de-DE',
    'hi-IN',
    'ja-JP',
    'ko-KR',
    'ru-RU',
    'es-ES',
    'tr-TR'
  ],
  extract: {
    input: ['app/**/*.{ts,tsx}'],
    ignore: ['**/*.test.*', '**/__mocks__/**', '**/*.d.ts'],
    output: 'app/i18n/locales/{{language}}/translation.json',
    defaultNS: 'translation',
    keySeparator: false,
    nsSeparator: false,
    primaryLanguage: 'en-US',
    // Non-destructive: keep manually-seeded keys (and any not currently
    // referenced in source) instead of pruning them. i18next-cli defaults
    // removeUnusedKeys to true, which would wipe the seed catalog while
    // there are ~zero t()/<Trans> consumers yet.
    removeUnusedKeys: false,
    // Natural-English keys: the key IS the English string. On extraction a
    // NEW key is written as key===value in EN and "" in every other locale
    // (a Crowdin placeholder); existing non-EN translations are preserved
    // (removeUnusedKeys:false above).
    // Note: i18next-cli 1.66.x calls defaultValue as
    // (key, namespace, language, value) — the language is the 3rd arg.
    defaultValue: (key: string, _namespace: string, language: string) =>
      language === 'en-US' ? key : ''
  },
  types: {
    // Generate types from the EN source of truth (the flat `translation`
    // namespace written by `extract`).
    input: ['app/i18n/locales/en-US/translation.json'],
    // `output` is the augmentation file and `resourcesFile` is the generated
    // Resources interface. The generator always writes `resourcesFile` and
    // SKIPS `output` when it already exists — so our hand-written i18next.d.ts
    // (which sets defaultNS + keySeparator/nsSeparator) is preserved. Set both
    // explicitly rather than relying on the output===resourcesFile write-order.
    output: 'app/i18n/@types/i18next.d.ts',
    resourcesFile: 'app/i18n/@types/resources.d.ts'
  }
})
