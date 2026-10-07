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

export type SiweParseResult =
  | { kind: 'ok'; message: SiweMessage }
  | { kind: 'malformed'; reason: string }

// Line separators other than "\n" that some renderers treat as a line break
// (CR, VT, FF, NEL, LS, PS). Any of them lets a fake field hide from a strict
// "\n"-only parser while still looking like a new line to the user.
const FORBIDDEN_SEPARATORS = ['\r', '\v', '\f', '\u0085', '\u2028', '\u2029']

const REQUIRED_FIELDS = [
  'URI',
  'Version',
  'Chain ID',
  'Nonce',
  'Issued At'
] as const
const OPTIONAL_FIELDS = ['Expiration Time', 'Not Before', 'Request ID'] as const

const malformed = (reason: string): SiweParseResult => ({
  kind: 'malformed',
  reason
})

/**
 * Strict EIP-4361 parse. Returns undefined when the message is not SIWE at all
 * (header does not match). When the header matches but the body is malformed or
 * ambiguous it returns `{ kind: 'malformed' }` so callers can raise an alert
 * instead of silently treating the message as non-SIWE (CP-15105 R2-7).
 */
export function parseSiweMessageStrict(
  message: string
): SiweParseResult | undefined {
  const headerMatch = SIWE_HEADER_REGEX.exec(message)
  if (!headerMatch?.groups) return undefined

  if (FORBIDDEN_SEPARATORS.some(sep => message.includes(sep))) {
    return malformed('unsupported line separator')
  }

  const { domain, address } = headerMatch.groups as {
    domain: string
    address: string
  }

  const sections = splitStatementAndFields(message.slice(headerMatch[0].length))
  if (!sections) return malformed('unexpected layout')

  const fields = parseFields(sections.fields)
  if (!fields) return malformed('invalid or ambiguous fields')

  return {
    kind: 'ok',
    message: {
      domain,
      address,
      statement: sections.statement || undefined,
      uri: fields.URI as string,
      version: fields.Version as string,
      chainId: fields['Chain ID'] as string,
      nonce: fields.Nonce as string,
      issuedAt: fields['Issued At'] as string,
      expirationTime: fields['Expiration Time'],
      notBefore: fields['Not Before'],
      requestId: fields['Request ID'],
      resources: fields.resources
    }
  }
}

export function parseSiweMessage(message: string): SiweMessage | undefined {
  const result = parseSiweMessageStrict(message)
  return result?.kind === 'ok' ? result.message : undefined
}

// `afterAddress` starts right after the address line's "\n". EIP-4361:
// address LF LF [statement] LF fields. We also accept the lenient form without
// the extra LF that omits the statement.
function splitStatementAndFields(
  afterAddress: string
): { statement?: string; fields: string } | undefined {
  if (!afterAddress.startsWith('\n')) return undefined
  const rest = afterAddress.slice(1)

  if (rest.startsWith('URI: ')) return { fields: rest }
  if (rest.startsWith('\nURI: ')) return { fields: rest.slice(1) }

  const idx = rest.indexOf('\n\nURI: ')
  if (idx === -1) return undefined
  const statement = rest.slice(0, idx)
  // EIP-4361 statement has no newlines; a multi-line one is how a fake "URI:"
  // line gets ahead of the real structured section.
  if (statement.includes('\n')) return undefined
  return { statement: statement.trim(), fields: rest.slice(idx + 2) }
}

type ParsedFields = Record<string, string | undefined> & {
  resources?: string[]
}

function parseFields(section: string): ParsedFields | undefined {
  const lines = section.split('\n')
  // allow a single trailing newline
  if (lines[lines.length - 1] === '') lines.pop()

  const out: ParsedFields = {}
  let i = 0

  for (const label of REQUIRED_FIELDS) {
    const value = readField(lines[i], label)
    if (!value) return undefined
    out[label] = value
    i++
  }

  for (const label of OPTIONAL_FIELDS) {
    const value = readField(lines[i], label)
    if (value) {
      out[label] = value
      i++
    }
  }

  if (lines[i] === 'Resources:') {
    const resources = lines.slice(i + 1)
    // EIP-4361 allows zero resources (`*( LF resource )`); viem emits a bare
    // `Resources:` for `resources: []`. Any non-resource line is malformed.
    if (!resources.every(isResourceLine)) {
      return undefined
    }
    out.resources = resources.map(line => line.slice(2).trim())
    i = lines.length
  }

  return i === lines.length ? out : undefined
}

const isResourceLine = (line: string): boolean =>
  line.startsWith('- ') && line.slice(2).trim().length > 0

function readField(
  line: string | undefined,
  label: string
): string | undefined {
  const prefix = `${label}: `
  if (line === undefined || !line.startsWith(prefix)) return undefined
  return line.slice(prefix.length).trim() || undefined
}
