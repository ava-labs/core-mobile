/**
 * Synchronous safety checks for a `wallet_addEthereumChain` RPC URL.
 *
 * Runs *before* we show the approval modal — the async chainId probe
 * (`isValidRPCUrl`) happens after user approval and lives separately.
 *
 * Rejections:
 * - non-HTTPS (http, ws, ws:)
 * - localhost / loopback (127/8, ::1, IPv4-mapped ::ffff:127.0.0.0/8)
 * - RFC1918 private IPv4 ranges (10/8, 172.16/12, 192.168/16)
 * - link-local IPv4 (169.254/16), IPv6 (fe80::/10)
 * - CGNAT (100.64/10)
 * - IPv6 unique-local (fc00::/7)
 *
 * Requires `react-native-url-polyfill/auto` (loaded in polyfills/index.js).
 * The stock Hermes `URL` is a regex-based class that does NOT normalize
 * octal/integer IPv4 encodings (e.g. `0177.0.0.1` → `127.0.0.1`) or IPv6
 * literals. Without the polyfill this validator becomes silently bypassable.
 */

export type RpcUrlValidationResult =
  | { ok: true }
  | { ok: false; reason: string }

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./
]

const LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  '::1'
])

// IPv6 prefixes (WHATWG-normalized hostnames include brackets) that indicate
// loopback, unique-local, or link-local addresses. Prefix-matched because
// the polyfill may produce `[::ffff:7f00:1]`, `[fc00::1]`, etc.
const LOCAL_IPV6_PREFIXES = [
  '[::ffff:7f', // IPv4-mapped loopback (127.0.0.0/8 mapped into v6)
  '[fc', // unique-local fc00::/7
  '[fd', // unique-local fd00::/8
  '[fe80:' // link-local fe80::/10
]

export function validateCustomRpcUrl(url: string): RpcUrlValidationResult {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { ok: false, reason: 'RPC URL is not a valid URL' }
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'RPC URL must use HTTPS' }
  }

  const hostname = parsed.hostname.toLowerCase()

  if (!hostname) {
    return { ok: false, reason: 'RPC URL has no host' }
  }

  if (LOCAL_HOSTS.has(hostname)) {
    return { ok: false, reason: 'Local RPC URLs are not allowed' }
  }

  for (const prefix of LOCAL_IPV6_PREFIXES) {
    if (hostname.startsWith(prefix)) {
      return {
        ok: false,
        reason: 'Local/private RPC URLs are not allowed'
      }
    }
  }

  for (const pattern of PRIVATE_IPV4_PATTERNS) {
    if (pattern.test(hostname)) {
      return { ok: false, reason: 'Private-network RPC URLs are not allowed' }
    }
  }

  return { ok: true }
}
