import { AlertType } from '@avalabs/vm-module-types'
import type { SiweMessage } from './parseSiweMessage'

type Alert = {
  type: AlertType
  details: {
    title: string
    description: string
    body?: string[]
  }
}

/**
 * Compares the SIWE message's domain and URI against the requesting dApp's
 * origin URL. Returns a DANGER alert if there is a mismatch in domain,
 * scheme, or port — which may indicate a phishing attempt.
 */
export function validateSiweOrigin(
  siwe: SiweMessage,
  dappUrl: string
): Alert | undefined {
  const dappOrigin = safeParseUrl(dappUrl)
  const siweUri = safeParseUrl(siwe.uri)

  if (!dappOrigin) return undefined

  const domainMismatch =
    normalizeDomain(siwe.domain) !== normalizeDomain(dappOrigin.hostname ?? '')

  const uriMismatch =
    siweUri !== undefined &&
    (normalizeScheme(siweUri.protocol) !==
      normalizeScheme(dappOrigin.protocol) ||
      effectivePort(siweUri) !== effectivePort(dappOrigin) ||
      normalizeDomain(siweUri.hostname ?? '') !==
        normalizeDomain(dappOrigin.hostname ?? ''))

  if (!domainMismatch && !uriMismatch) return undefined

  const dappHostname = dappOrigin.hostname ?? dappUrl
  const dappDisplay = formatOrigin(dappOrigin, dappUrl)
  const reasons: string[] = []
  if (domainMismatch)
    reasons.push(
      `Domain "${siwe.domain}" doesn't match dApp origin "${dappHostname}".`
    )
  if (uriMismatch)
    reasons.push(
      `URI "${siwe.uri}" doesn't match dApp origin "${dappDisplay}".`
    )

  return {
    type: AlertType.DANGER,
    details: {
      title: 'Sign-In Request Mismatch',
      description: 'This could be a phishing attempt. Proceed with caution.',
      body: reasons
    }
  }
}

function safeParseUrl(url: string): URL | undefined {
  try {
    // Handle bare domains (no scheme) by prepending https://
    if (!url.includes('://')) {
      return new URL(`https://${url}`)
    }
    return new URL(url)
  } catch {
    return undefined
  }
}

function normalizeDomain(domain: string): string {
  return domain.toLowerCase().replace(/\.$/, '')
}

function normalizeScheme(protocol: string): string {
  return protocol.replace(/:$/, '').toLowerCase()
}

const DEFAULT_PORTS: Record<string, string> = {
  'http:': '80',
  'https:': '443'
}

function effectivePort(url: URL): string {
  return url.port || DEFAULT_PORTS[url.protocol] || ''
}

function formatOrigin(url: URL, fallback: string): string {
  const hostname = url.hostname || fallback
  const scheme = normalizeScheme(url.protocol)
  const isStandardScheme = scheme === 'https'
  const hasNonStandardPort = url.port !== ''

  let result = hostname
  if (!isStandardScheme) {
    result = `${scheme}://${result}`
  }
  if (hasNonStandardPort) {
    result = `${result}:${url.port}`
  }
  return result
}
