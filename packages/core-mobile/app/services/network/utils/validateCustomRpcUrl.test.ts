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
    // eslint-disable-next-line no-script-url -- intentional: asserts the validator rejects script-scheme URLs
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
      // Link-local fe80::/10 — the full range is fe80–febf, not just fe80
      'https://[fe80::1]/rpc',
      'https://[fe80:abcd::1]/rpc',
      'https://[fe90::1]/rpc',
      'https://[fe9a::1]/rpc',
      'https://[fea0::1]/rpc',
      'https://[feb0::1]/rpc',
      'https://[febf::1]/rpc'
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

  describe('IPv6 encoding bypasses (regression)', () => {
    it.each([
      'https://[::ffff:127.0.0.1]/rpc', // IPv4-mapped loopback, dotted form
      'https://[0:0:0:0:0:0:0:1]/rpc', // fully-expanded loopback
      'https://[::ffff:10.0.0.1]/rpc', // IPv4-mapped private (10/8)
      'https://[::ffff:192.168.0.1]/rpc', // IPv4-mapped private (192.168/16)
      'https://[::ffff:a9fe:1]/rpc' // IPv4-mapped link-local 169.254.0.1 (hex)
    ])('rejects %s', url => {
      expect(validateCustomRpcUrl(url).ok).toBe(false)
    })

    it('still allows IPv4-mapped and bare public IPv6', () => {
      // 1.1.1.1 is public — its mapped form must remain allowed
      expect(validateCustomRpcUrl('https://[::ffff:1.1.1.1]/rpc')).toEqual({
        ok: true
      })
      // public IPv6 (Cloudflare) — allowed
      expect(validateCustomRpcUrl('https://[2606:4700::1111]/rpc')).toEqual({
        ok: true
      })
      // fe7f / fec0 are just OUTSIDE link-local (fe80–febf) — must NOT be
      // over-blocked by the /10 check
      expect(validateCustomRpcUrl('https://[fe7f::1]/rpc')).toEqual({
        ok: true
      })
      expect(validateCustomRpcUrl('https://[fec0::1]/rpc')).toEqual({
        ok: true
      })
    })
  })

  describe('loopback range', () => {
    it('rejects 127.0.0.0/8 beyond 127.0.0.1', () => {
      expect(validateCustomRpcUrl('https://127.0.0.2/rpc').ok).toBe(false)
    })
  })

  // The validator relies on the WHATWG URL parser (react-native-url-polyfill in
  // app, Node URL here) to normalize alternate IPv4 encodings to dotted-quad.
  // Pin that defense so a regression to a non-normalizing URL impl is caught.
  describe('alternate IPv4 encodings normalize and are rejected', () => {
    it.each([
      'https://2130706433/rpc', // decimal 127.0.0.1
      'https://0x7f000001/rpc', // hex 127.0.0.1
      'https://0177.0.0.1/rpc', // octal-leading 127.0.0.1
      'https://0xa000001/rpc' // hex 10.0.0.1 (private)
    ])('rejects %s', url => {
      expect(validateCustomRpcUrl(url).ok).toBe(false)
    })
  })
})
