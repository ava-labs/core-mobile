type NumericVersion = [major: number, minor: number, patch: number]

const NUMERIC_VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)$/

/**
 * Strictly parses a numeric MAJOR.MINOR.PATCH string. Anything else — a `v`
 * prefix, pre-release/build suffixes, missing parts, whitespace — is rejected.
 */
export const parseNumericVersion = (
  version: unknown
): NumericVersion | undefined => {
  if (typeof version !== 'string') return undefined
  const match = NUMERIC_VERSION_REGEX.exec(version)
  if (!match) return undefined
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

/**
 * True only when both versions parse strictly and `installed` is lower than
 * `recommended`; an unreadable version on either side never reports outdated.
 */
export const isAppVersionOutdated = (
  installed: unknown,
  recommended: unknown
): boolean => {
  const current = parseNumericVersion(installed)
  const target = parseNumericVersion(recommended)
  if (!current || !target) return false

  for (let i = 0; i < target.length; i++) {
    const a = current[i] as number
    const b = target[i] as number
    if (a !== b) return a < b
  }
  return false
}
