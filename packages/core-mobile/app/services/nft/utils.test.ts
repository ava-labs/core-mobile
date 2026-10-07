import { assertSafeNftUrl } from './utils'

describe('assertSafeNftUrl', () => {
  it.each([
    'https://[::ffff:127.0.0.1]/x',
    'https://[::ffff:7f00:1]/x',
    'https://[::ffff:a9fe:a9fe]/latest/meta-data',
    'https://100.64.0.1/x',
    'https://100.127.255.254/x',
    'https://169.254.169.254/latest/meta-data',
    'https://localhost/x',
    'https://localhost./x',
    'https://foo.local./x',
    'https://10.0.0.1/x'
  ])('rejects private or mapped host %s (R2-9)', url => {
    expect(() => assertSafeNftUrl(url)).toThrow(/private\/reserved host/)
  })

  it('upgrades http to https and returns the URL to fetch (R2-10)', () => {
    expect(assertSafeNftUrl('http://example.com/a.png')).toBe(
      'https://example.com/a.png'
    )
  })

  it('still rejects an http URL whose host is private after upgrade', () => {
    expect(() => assertSafeNftUrl('http://192.168.1.1/a.png')).toThrow(
      /private\/reserved host/
    )
  })

  it('rejects non-http(s) schemes', () => {
    expect(() => assertSafeNftUrl('ftp://example.com/a')).toThrow(/non-https/)
  })

  it('returns a public https URL unchanged', () => {
    expect(assertSafeNftUrl('https://ipfs.io/ipfs/Qm')).toBe(
      'https://ipfs.io/ipfs/Qm'
    )
  })
})
