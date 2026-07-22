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
    // Natural-English keys: the key IS the English string. EN source gets
    // key===value; every other locale stays empty for Crowdin to fill.
    // Note: i18next-cli 1.66.x calls defaultValue as
    // (key, namespace, language, value) — the language is the 3rd arg.
    defaultValue: (key: string, _namespace: string, language: string) =>
      language === 'en-US' ? key : ''
  },
  types: {
    // Generate types from the EN source of truth (the flat `translation`
    // namespace written by `extract`).
    input: ['app/i18n/locales/en-US/translation.json'],
    output: 'app/i18n/@types/resources.d.ts'
  }
})
