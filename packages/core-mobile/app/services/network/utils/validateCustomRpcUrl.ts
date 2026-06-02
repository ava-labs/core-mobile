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
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./,
  /^127\./ // loopback 127.0.0.0/8 (not just 127.0.0.1)
]

const LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  '::1'
])

// True for IPv6 literals (brackets stripped, WHATWG-lowercased) in the
// local/private ranges, matched on the leading hextet:
//   unique-local  fc00::/7   → first byte fc or fd
//   link-local    fe80::/10  → fe80–febf, i.e. 3rd nibble is 8–b
// The fe80 check covers the whole /10 range (fe80, fe9x, feax, febx), not just
// the literal `fe80` — otherwise [fe9a::1] / [fea0::1] / [febf::1] slip through.
// IPv4-mapped addresses are handled numerically by extractMappedIpv4 instead.
function isLocalIpv6(inner: string): boolean {
  return /^f[cd]/i.test(inner) || /^fe[89ab][0-9a-f]:/i.test(inner)
}

function isBlockedIpv4(ip: string): boolean {
  if (LOCAL_HOSTS.has(ip)) return true
  return PRIVATE_IPV4_PATTERNS.some(pattern => pattern.test(ip))
}

// Extract the embedded IPv4 from an IPv4-mapped IPv6 literal — both the dotted
// form (`::ffff:10.0.0.1`) and the WHATWG hex-normalized form (`::ffff:a00:1`)
// — returning dotted-quad, or null if the literal is not IPv4-mapped. Lets the
// IPv4 private/loopback checks run on mapped addresses regardless of how the
// URL parser serialized them.
function extractMappedIpv4(innerV6: string): string | null {
  const rest = /^::ffff:(.+)$/i.exec(innerV6)?.[1]
  if (!rest) return null
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rest)) return rest
  const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(rest)
  const hiStr = hex?.[1]
  const loStr = hex?.[2]
  if (hiStr && loStr) {
    const hi = parseInt(hiStr, 16) // first two octets, 0..0xffff
    const lo = parseInt(loStr, 16) // last two octets, 0..0xffff
    return `${Math.floor(hi / 256)}.${hi % 256}.${Math.floor(lo / 256)}.${
      lo % 256
    }`
  }
  return null
}

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

  if (hostname.startsWith('[')) {
    // IPv6 literal. Catch IPv4-mapped loopback/private addresses numerically,
    // then unique-local / link-local prefixes.
    const inner = hostname.slice(1, -1)
    const mapped = extractMappedIpv4(inner)
    if (mapped && isBlockedIpv4(mapped)) {
      return { ok: false, reason: 'Local/private RPC URLs are not allowed' }
    }
    if (isLocalIpv6(inner)) {
      return { ok: false, reason: 'Local/private RPC URLs are not allowed' }
    }
    return { ok: true }
  }

  if (isBlockedIpv4(hostname)) {
    return { ok: false, reason: 'Private-network RPC URLs are not allowed' }
  }

  return { ok: true }
}
