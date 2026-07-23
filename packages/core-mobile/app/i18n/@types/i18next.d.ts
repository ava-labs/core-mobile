import 'i18next'
import type Resources from './resources'

// Bind the generated catalog to i18next so t() keys are type-checked against
// the EN source. Single `translation` namespace (see app/i18n/index.ts).
// `resources.d.ts` default-exports the `Resources` interface (a type), so it
// is imported and used directly rather than via `typeof`.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: Resources
    // Both separators are disabled at runtime (app/i18n/index.ts). Mirror that
    // here so natural-English keys containing ':' or '.' are treated as flat
    // literal keys, not parsed as namespace:key / nested paths.
    keySeparator: false
    nsSeparator: false
  }
}
