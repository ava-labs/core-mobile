import { parseSiweMessage } from './parseSiweMessage'

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
Nonce: abc123
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
Nonce: abc
Issued At: 2021-09-30T16:25:24Z`
    const result = parseSiweMessage(message)
    expect(result?.domain).toBe('localhost:3000')
  })
})
