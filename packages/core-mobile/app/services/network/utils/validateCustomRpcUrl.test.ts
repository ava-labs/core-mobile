import { validateCustomRpcUrl } from './validateCustomRpcUrl'

describe('validateCustomRpcUrl', () => {
  describe('happy path', () => {
    it.each([
      'https://eth.llamarpc.com',
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.gnosischain.com',
      'https://linea-mainnet.infura.io/v3/abc123',
      'https://1.1.1.1/rpc' // public IP — allowed
    ])('accepts %s', url => {
      expect(validateCustomRpcUrl(url)).toEqual({ ok: true })
    })
  })

  describe('malformed URLs', () => {
    it.each(['', 'not-a-url', 'javascript:alert(1)'])(
      'rejects %s as invalid URL',
      url => {
        const result = validateCustomRpcUrl(url)
        expect(result.ok).toBe(false)
        if (!result.ok) {
          expect(result.reason).toMatch(/valid URL|HTTPS/)
        }
      }
    )
  })

  describe('non-HTTPS schemes', () => {
    it.each([
      'http://example.com',
      'ws://example.com',
      'wss://example.com',
      'ftp://example.com'
    ])('rejects %s', url => {
      const result = validateCustomRpcUrl(url)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain('HTTPS')
      }
    })
  })

  describe('local hosts', () => {
    it.each([
      'https://localhost/rpc',
      'https://localhost:8545',
      'https://127.0.0.1/rpc',
      'https://0.0.0.0/rpc',
      'https://[::1]/rpc',
      'https://LOCALHOST/rpc' // case-insensitive
    ])('rejects %s', url => {
      const result = validateCustomRpcUrl(url)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain('Local')
      }
    })
  })

  describe('IPv6 private/loopback', () => {
    it.each([
      // IPv4-mapped loopback, WHATWG-normalized form from the URL polyfill
      'https://[::ffff:7f00:1]/rpc',
      'https://[::ffff:7fff:ffff]/rpc',
      // Unique-local fc00::/7 (both fc and fd prefixes)
      'https://[fc00::1]/rpc',
      'https://[fd00::1]/rpc',
      'https://[fdab:cdef::1]/rpc',
      // Link-local fe80::/10
      'https://[fe80::1]/rpc',
      'https://[fe80:abcd::1]/rpc'
    ])('rejects %s', url => {
      const result = validateCustomRpcUrl(url)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toMatch(/Local|Private/)
      }
    })
  })

  describe('private IPv4 ranges', () => {
    it.each([
      'https://10.0.0.1/rpc',
      'https://10.255.255.255/rpc',
      'https://192.168.1.1/rpc',
      'https://192.168.50.50/rpc',
      'https://172.16.0.1/rpc',
      'https://172.20.10.5/rpc',
      'https://172.31.255.255/rpc',
      'https://169.254.1.1/rpc', // link-local
      'https://100.64.0.1/rpc' // CGNAT
    ])('rejects %s', url => {
      const result = validateCustomRpcUrl(url)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain('Private')
      }
    })

    it('does NOT reject public IPs that look superficially similar', () => {
      // 172.15 is NOT in the 172.16-31 private block — should be allowed
      expect(validateCustomRpcUrl('https://172.15.0.1/rpc')).toEqual({
        ok: true
      })
      // 172.32 is also outside the private block
      expect(validateCustomRpcUrl('https://172.32.0.1/rpc')).toEqual({
        ok: true
      })
      // 100.63 is outside CGNAT (100.64-127)
      expect(validateCustomRpcUrl('https://100.63.0.1/rpc')).toEqual({
        ok: true
      })
    })
  })
})
