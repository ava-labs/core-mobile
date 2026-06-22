// First-party origins trusted to use Core's privileged `avalanche_*` methods
// (X/P account management + signing). Mirrors the core-extension allowlist
// (KNOWN_CORE_DOMAINS + AvaCloud, see packages/common/src/constants.ts) so the
// two clients agree on what "first-party" means. CP-13672.
//
// Matching is host-based with SAFE subdomain matching — exact host, or a strict
// suffix preceded by a dot (`host === d || host.endsWith('.' + d)`). We do NOT
// use the extension's `domain.split('.')` "drop-one-label" comparison: that is
// loose around multi-level suffixes and only strips a single subdomain level.
// The suffix-with-dot form rejects look-alikes like `notcore.app` or
// `core.app.evil.com` while still accepting any depth of genuine subdomain
// (`staging.core.app`, `deploy-preview.avalabs.workers.dev`).
//
// Only the SPECIFIC Avalabs-owned hosts on shared multi-tenant suffixes are
// listed (`avalabs.workers.dev`, `avacloud-app.pages.dev`) — never the bare
// `workers.dev` / `pages.dev`, which anyone can register a subdomain on.
const FIRST_PARTY_DOMAINS = [
  'core.app', // + every *.core.app (staging / develop / etc.)
  'avalabs.workers.dev', // Core web preview deploys
  'avacloud.io', // + launchpad.avacloud.io etc.
  'avacloud-app.pages.dev', // AvaCloud preview deploys
  'ava-labs.github.io' // playground
]

// Local-development hosts. Trusted ONLY in __DEV__ builds so a production build
// never treats a page served from the device itself as first-party.
const DEV_ONLY_DOMAINS = ['localhost', '127.0.0.1']

const getHost = (origin: string | undefined): string | undefined => {
  if (!origin) return undefined
  try {
    const host = new URL(origin).hostname.toLowerCase()
    return host || undefined
  } catch {
    return undefined
  }
}

const hostMatchesDomain = (host: string, domain: string): boolean =>
  host === domain || host.endsWith(`.${domain}`)

/**
 * Whether `origin` (a full origin string, e.g. `https://core.app`) is one of
 * Core's own first-party surfaces, and therefore allowed to invoke privileged
 * `avalanche_*` methods. Returns false for any third-party, look-alike, or
 * malformed origin. CP-13672.
 */
export const isFirstPartyOrigin = (origin: string | undefined): boolean => {
  const host = getHost(origin)
  if (!host) return false
  const allowlist =
    typeof __DEV__ !== 'undefined' && __DEV__
      ? [...FIRST_PARTY_DOMAINS, ...DEV_ONLY_DOMAINS]
      : FIRST_PARTY_DOMAINS
  return allowlist.some(domain => hostMatchesDomain(host, domain))
}
