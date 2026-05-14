/**
 * Builds a Sentry fingerprint for the supplied scope.
 *
 * When `discriminator` is a non-empty string the event is grouped per
 * (scope, discriminator) — e.g. a per-revert-signature bucket for fee
 * estimation errors. When it is missing, the fingerprint falls back to
 * Sentry's `{{ default }}` token so events are still grouped by stack
 * (without this fallback, calling `setFingerprint` would replace the
 * default grouping and collapse every discriminator-less event into one
 * issue).
 */
export const buildSentryFingerprint = (
  scope: string,
  discriminator?: string | null
): string[] =>
  typeof discriminator === 'string' && discriminator.length > 0
    ? [scope, discriminator]
    : ['{{ default }}']
