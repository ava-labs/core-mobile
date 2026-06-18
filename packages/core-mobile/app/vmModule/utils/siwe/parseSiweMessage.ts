/**
 * Minimal EIP-4361 (Sign-In with Ethereum) message parser.
 *
 * Reference: https://eips.ethereum.org/EIPS/eip-4361
 *
 * Message format:
 * ${domain} wants you to sign in with your Ethereum account:\n
 * ${address}\n
 * \n
 * ${statement (optional)}\n
 * \n
 * URI: ${uri}\n
 * Version: ${version}\n
 * Chain ID: ${chain-id}\n
 * Nonce: ${nonce}\n
 * Issued At: ${issued-at}\n
 * [Expiration Time: ...]\n
 * [Not Before: ...]\n
 * [Request ID: ...]\n
 * [Resources:\n- ...\n- ...]
 */

export type SiweMessage = {
  domain: string
  address: string
  uri: string
  version: string
  chainId: string
  nonce: string
  issuedAt: string
  statement?: string
  expirationTime?: string
  notBefore?: string
  requestId?: string
  resources?: string[]
}

const SIWE_HEADER_REGEX =
  /^(?<domain>[^ ]+) wants you to sign in with your Ethereum account:\n(?<address>0x[a-fA-F0-9]{40})\n/

export function parseSiweMessage(message: string): SiweMessage | undefined {
  const headerMatch = SIWE_HEADER_REGEX.exec(message)
  if (!headerMatch?.groups) return undefined

  const { domain, address } = headerMatch.groups as {
    domain: string
    address: string
  }

  // Fields must be parsed only from the structured section that follows the
  // optional statement. The structured section begins after the double newline
  // that terminates the statement (or immediately after the header if there is
  // no statement). Limiting extraction to this section prevents a malicious
  // statement from injecting fake field values.
  const structuredSection = extractStructuredSection(message, headerMatch[0])
  if (!structuredSection) return undefined

  const uri = extractField(structuredSection, 'URI')
  const version = extractField(structuredSection, 'Version')
  const chainId = extractField(structuredSection, 'Chain ID')
  const nonce = extractField(structuredSection, 'Nonce')
  const issuedAt = extractField(structuredSection, 'Issued At')

  if (!uri || !version || !chainId || !nonce || !issuedAt) return undefined

  const statement = extractStatement(message, headerMatch[0])

  return {
    domain,
    address,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    statement: statement || undefined,
    expirationTime:
      extractField(structuredSection, 'Expiration Time') || undefined,
    notBefore: extractField(structuredSection, 'Not Before') || undefined,
    requestId: extractField(structuredSection, 'Request ID') || undefined,
    resources: extractResources(structuredSection)
  }
}

function extractField(message: string, fieldName: string): string | undefined {
  const regex = new RegExp(`^${fieldName}: (.+)$`, 'm')
  return regex.exec(message)?.[1]?.trim()
}

function extractStructuredSection(
  message: string,
  headerText: string
): string | undefined {
  const afterHeader = message.slice(headerText.length)
  // The structured fields start after \n\n (end of optional statement) or \nURI:
  const doubleNewline = afterHeader.indexOf('\n\n')
  if (doubleNewline !== -1) {
    return afterHeader.slice(doubleNewline + 2)
  }
  // No statement — fields start after the leading newline following the address
  const uriStart = afterHeader.indexOf('\nURI:')
  if (uriStart !== -1) {
    return afterHeader.slice(uriStart + 1)
  }
  return undefined
}

function extractStatement(
  message: string,
  headerText: string
): string | undefined {
  const afterHeader = message.slice(headerText.length)
  const match = /^\n([\s\S]*?)\n\nURI: /m.exec(afterHeader)
  return match?.[1]?.trim() || undefined
}

function extractResources(message: string): string[] | undefined {
  const match = /\nResources:\n([\s\S]*)$/.exec(message)
  if (!match?.[1]) return undefined

  const resources = match[1]
    .split('\n')
    .map(line => line.replace(/^- /, '').trim())
    .filter(Boolean)

  return resources.length > 0 ? resources : undefined
}
