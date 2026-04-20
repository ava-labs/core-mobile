import { AlertType } from '@avalabs/vm-module-types'
import type { SiweMessage } from './parseSiweMessage'
import { validateSiweOrigin } from './validateSiweOrigin'

const baseSiwe: SiweMessage = {
  domain: 'example.com',
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  uri: 'https://example.com/login',
  version: '1',
  chainId: '1',
  nonce: '123',
  issuedAt: '2021-09-30T16:25:24Z'
}

describe('validateSiweOrigin', () => {
  it('returns undefined when domain and URI match dApp origin', () => {
    const result = validateSiweOrigin(baseSiwe, 'https://example.com')
    expect(result).toBeUndefined()
  })

  it('returns undefined when dApp URL has a path', () => {
    const result = validateSiweOrigin(baseSiwe, 'https://example.com/some/path')
    expect(result).toBeUndefined()
  })

  it('returns DANGER alert on domain mismatch', () => {
    const siwe = { ...baseSiwe, domain: 'evil.com' }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeDefined()
    expect(result?.type).toBe(AlertType.DANGER)
    expect(result?.details.body).toContainEqual(
      'Domain "evil.com" doesn\'t match dApp origin "example.com".'
    )
  })

  it('returns DANGER alert on scheme mismatch', () => {
    const siwe = { ...baseSiwe, uri: 'http://example.com/login' }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeDefined()
    expect(result?.type).toBe(AlertType.DANGER)
    expect(result?.details.body).toContainEqual(
      'URI "http://example.com/login" doesn\'t match dApp origin "example.com".'
    )
  })

  it('returns DANGER alert on port mismatch', () => {
    const siwe = {
      ...baseSiwe,
      domain: 'localhost:3000',
      uri: 'http://localhost:3000'
    }
    const result = validateSiweOrigin(siwe, 'http://localhost:4000')
    expect(result).toBeDefined()
    expect(result?.type).toBe(AlertType.DANGER)
    expect(result?.details.body).toContainEqual(
      'URI "http://localhost:3000" doesn\'t match dApp origin "http://localhost:4000".'
    )
  })

  it('detects similar port numbers (e.g., 443 vs 4433)', () => {
    const siwe = {
      ...baseSiwe,
      uri: 'https://example.com:4433/login'
    }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeDefined()
    expect(result?.type).toBe(AlertType.DANGER)
    expect(result?.details.body).toContainEqual(
      'URI "https://example.com:4433/login" doesn\'t match dApp origin "example.com".'
    )
  })

  it('treats default HTTPS port 443 as equivalent to no port', () => {
    const siwe = {
      ...baseSiwe,
      uri: 'https://example.com:443/login'
    }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeUndefined()
  })

  it('treats default HTTP port 80 as equivalent to no port', () => {
    const siwe = {
      ...baseSiwe,
      uri: 'http://example.com:80/login'
    }
    const result = validateSiweOrigin(siwe, 'http://example.com')
    expect(result).toBeUndefined()
  })

  it('returns DANGER when URI host differs from dApp origin', () => {
    const siwe = {
      ...baseSiwe,
      uri: 'https://evil.com/login'
    }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeDefined()
    expect(result?.type).toBe(AlertType.DANGER)
    expect(result?.details.body).toContainEqual(
      'URI "https://evil.com/login" doesn\'t match dApp origin "example.com".'
    )
  })

  it('is case-insensitive for domains', () => {
    const siwe = { ...baseSiwe, domain: 'Example.COM' }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeUndefined()
  })

  it('returns undefined when dApp URL cannot be parsed', () => {
    const result = validateSiweOrigin(baseSiwe, '')
    expect(result).toBeUndefined()
  })

  it('handles dApp URL without scheme', () => {
    // The dApp URL from WalletConnect sometimes doesn't have a scheme
    const result = validateSiweOrigin(baseSiwe, 'example.com')
    expect(result).toBeUndefined()
  })

  it('returns undefined when domain includes matching scheme', () => {
    const siwe = { ...baseSiwe, domain: 'https://example.com' }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeUndefined()
  })

  it('returns DANGER when domain includes mismatched scheme', () => {
    const siwe = { ...baseSiwe, domain: 'http://example.com' }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeDefined()
    expect(result?.type).toBe(AlertType.DANGER)
  })

  it('returns undefined when domain has no scheme (scheme is optional per EIP-4361)', () => {
    const siwe = { ...baseSiwe, domain: 'example.com' }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeUndefined()
  })

  it('returns undefined when domain includes matching port', () => {
    const siwe = {
      ...baseSiwe,
      domain: 'localhost:3000',
      uri: 'http://localhost:3000'
    }
    const result = validateSiweOrigin(siwe, 'http://localhost:3000')
    expect(result).toBeUndefined()
  })

  it('returns DANGER when domain includes mismatched port', () => {
    const siwe = {
      ...baseSiwe,
      domain: 'localhost:3000',
      uri: 'http://localhost:4000'
    }
    const result = validateSiweOrigin(siwe, 'http://localhost:4000')
    expect(result).toBeDefined()
    expect(result?.type).toBe(AlertType.DANGER)
  })

  it('returns undefined when domain has scheme and port that match', () => {
    const siwe = {
      ...baseSiwe,
      domain: 'http://localhost:3000',
      uri: 'http://localhost:3000'
    }
    const result = validateSiweOrigin(siwe, 'http://localhost:3000')
    expect(result).toBeUndefined()
  })

  it('returns DANGER when domain has scheme and port with scheme mismatch', () => {
    const siwe = {
      ...baseSiwe,
      domain: 'http://localhost:3000',
      uri: 'https://localhost:3000'
    }
    const result = validateSiweOrigin(siwe, 'https://localhost:3000')
    expect(result).toBeDefined()
    expect(result?.type).toBe(AlertType.DANGER)
  })

  it('reports multiple mismatches at once', () => {
    const siwe = {
      ...baseSiwe,
      domain: 'evil.com',
      uri: 'http://evil.com:8080/login'
    }
    const result = validateSiweOrigin(siwe, 'https://example.com')
    expect(result).toBeDefined()
    expect(result?.details.body).toContainEqual(
      'Domain "evil.com" doesn\'t match dApp origin "example.com".'
    )
    expect(result?.details.body).toContainEqual(
      'URI "http://evil.com:8080/login" doesn\'t match dApp origin "example.com".'
    )
  })
})
