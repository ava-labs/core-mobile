import { parseSiweMessage, parseSiweMessageStrict } from './parseSiweMessage'

const VALID_SIWE_MESSAGE = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

Sign in to Example App

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z`

const MINIMAL_SIWE_MESSAGE = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: abc12345
Issued At: 2021-09-30T16:25:24Z`

const FULL_SIWE_MESSAGE = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

I accept the Terms of Service: https://example.com/tos

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2021-09-30T16:25:24Z
Expiration Time: 2021-10-01T16:25:24Z
Not Before: 2021-09-30T16:25:24Z
Request ID: some-request-id
Resources:
- https://example.com/resource1
- https://example.com/resource2`

describe('parseSiweMessage', () => {
  it('parses a valid SIWE message with statement', () => {
    const result = parseSiweMessage(VALID_SIWE_MESSAGE)
    expect(result).toEqual({
      domain: 'example.com',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      statement: 'Sign in to Example App',
      uri: 'https://example.com/login',
      version: '1',
      chainId: '1',
      nonce: '32891756',
      issuedAt: '2021-09-30T16:25:24Z',
      expirationTime: undefined,
      notBefore: undefined,
      requestId: undefined,
      resources: undefined
    })
  })

  it('parses a minimal SIWE message without statement', () => {
    const result = parseSiweMessage(MINIMAL_SIWE_MESSAGE)
    expect(result).toBeDefined()
    expect(result?.domain).toBe('example.com')
    expect(result?.statement).toBeUndefined()
  })

  it('parses all optional fields', () => {
    const result = parseSiweMessage(FULL_SIWE_MESSAGE)
    expect(result).toBeDefined()
    expect(result?.expirationTime).toBe('2021-10-01T16:25:24Z')
    expect(result?.notBefore).toBe('2021-09-30T16:25:24Z')
    expect(result?.requestId).toBe('some-request-id')
    expect(result?.resources).toEqual([
      'https://example.com/resource1',
      'https://example.com/resource2'
    ])
  })

  it('returns undefined for non-SIWE messages', () => {
    expect(parseSiweMessage('Hello world')).toBeUndefined()
    expect(parseSiweMessage('')).toBeUndefined()
    expect(parseSiweMessage('Please sign this message')).toBeUndefined()
  })

  it('returns undefined when required fields are missing', () => {
    const incomplete = `example.com wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: https://example.com/login
Version: 1`
    expect(parseSiweMessage(incomplete)).toBeUndefined()
  })

  it('handles domain with port', () => {
    const message = `localhost:3000 wants you to sign in with your Ethereum account:
0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

URI: http://localhost:3000
Version: 1
Chain ID: 1
Nonce: abc12345
Issued At: 2021-09-30T16:25:24Z`
    const result = parseSiweMessage(message)
    expect(result?.domain).toBe('localhost:3000')
  })

  describe('malformed / ambiguous messages (R2-7)', () => {
    const HEADER =
      'victim.com wants you to sign in with your Ethereum account:\n' +
      '0x0000000000000000000000000000000000000001\n'
    const TAIL =
      'Version: 1\nChain ID: 1\nNonce: abc12345\nIssued At: 2026-10-06T00:00:00Z'

    it.each([
      [
        'multi-line statement with blank-line URI',
        HEADER +
          '\nLegit statement\n\nURI: https://evil.com\n\nURI: https://victim.com\n' +
          TAIL
      ],
      [
        'duplicate URI without blank line',
        HEADER + '\nURI: https://evil.com\nURI: https://victim.com\n' + TAIL
      ],
      [
        'CRLF CRLF separator',
        HEADER +
          '\nLegit\r\n\r\nURI: https://evil.com\n\nURI: https://victim.com\n' +
          TAIL
      ],
      [
        'CR CR separator',
        HEADER +
          '\nLegit\r\rURI: https://evil.com\n\nURI: https://victim.com\n' +
          TAIL
      ],
      [
        'unicode line separator',
        HEADER +
          '\nLegit\u2028\u2028URI: https://evil.com\n\nURI: https://victim.com\n' +
          TAIL
      ],
      [
        'URI smuggled after Resources',
        HEADER +
          '\nURI: https://victim.com\n' +
          TAIL +
          '\nResources:\nURI: https://evil.com'
      ]
    ])('flags %s as malformed', (_name, msg) => {
      expect(parseSiweMessageStrict(msg)?.kind).toBe('malformed')
      expect(parseSiweMessage(msg)).toBeUndefined()
    })

    it('returns undefined (not malformed) when the header does not match', () => {
      expect(parseSiweMessageStrict('Hello world')).toBeUndefined()
    })

    it('accepts an empty statement line per EIP-4361', () => {
      const msg = HEADER + '\n\nURI: https://victim.com\n' + TAIL
      expect(parseSiweMessageStrict(msg)?.kind).toBe('ok')
    })

    it('accepts a bare Resources: line with zero items (viem shape)', () => {
      const msg = HEADER + '\nURI: https://victim.com\n' + TAIL + '\nResources:'
      expect(parseSiweMessageStrict(msg)?.kind).toBe('ok')
    })

    it('flags Resources: followed by a non-resource line as malformed', () => {
      const msg =
        HEADER +
        '\nURI: https://victim.com\n' +
        TAIL +
        '\nResources:\nnot a resource'
      expect(parseSiweMessageStrict(msg)?.kind).toBe('malformed')
    })

    it.each([
      ['URI without a scheme/not a URL', 'URI: not a url', 'invalid URI'],
      ['unsupported version', 'Version: 2', 'unsupported version'],
      ['non-numeric chain id', 'Chain ID: 1x', 'invalid chain id'],
      ['short nonce', 'Nonce: abc', 'invalid nonce'],
      ['non-RFC3339 timestamp', 'Issued At: yesterday', 'invalid timestamp']
    ])('flags %s as malformed', (_name, override, reason) => {
      const label = override.split(': ')[0]
      const fields = [
        'URI: https://victim.com',
        'Version: 1',
        'Chain ID: 1',
        'Nonce: abc12345',
        'Issued At: 2026-10-06T00:00:00Z'
      ].map(line => (line.startsWith(`${label}: `) ? override : line))
      const msg = HEADER + '\n' + fields.join('\n')
      expect(parseSiweMessageStrict(msg)).toEqual({ kind: 'malformed', reason })
    })

    it.each(['550e8400-e29b-41d4-a716-446655440000', 'a-b_c1234'])(
      'accepts URL-safe nonce %s',
      nonce => {
        const msg =
          HEADER +
          '\nURI: https://victim.com\nVersion: 1\nChain ID: 1\nNonce: ' +
          nonce +
          '\nIssued At: 2026-10-06T00:00:00Z'
        expect(parseSiweMessageStrict(msg)?.kind).toBe('ok')
      }
    )

    it('flags a nonce with disallowed characters as malformed', () => {
      const msg =
        HEADER +
        '\nURI: https://victim.com\nVersion: 1\nChain ID: 1\nNonce: abc!defgh\nIssued At: 2026-10-06T00:00:00Z'
      expect(parseSiweMessageStrict(msg)).toEqual({
        kind: 'malformed',
        reason: 'invalid nonce'
      })
    })

    it('accepts a single trailing newline', () => {
      const msg = HEADER + '\nURI: https://victim.com\n' + TAIL + '\n'
      expect(parseSiweMessageStrict(msg)?.kind).toBe('ok')
    })
  })
})
