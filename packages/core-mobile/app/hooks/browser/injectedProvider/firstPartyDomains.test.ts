import { isFirstPartyOrigin } from './firstPartyDomains'

describe('isFirstPartyOrigin', () => {
  const withDev = (value: boolean, fn: () => void): void => {
    const original = (global as { __DEV__?: boolean }).__DEV__
    ;(global as { __DEV__?: boolean }).__DEV__ = value
    try {
      fn()
    } finally {
      ;(global as { __DEV__?: boolean }).__DEV__ = original
    }
  }

  describe('first-party origins (trusted)', () => {
    it.each([
      'https://core.app',
      'https://staging.core.app',
      'https://develop.core.app',
      'https://app.core.app',
      'https://avalabs.workers.dev',
      'https://deploy-preview.avalabs.workers.dev',
      'https://avacloud.io',
      'https://launchpad.avacloud.io',
      'https://avacloud-app.pages.dev',
      'https://develop.avacloud-app.pages.dev',
      'https://ava-labs.github.io'
    ])('accepts %s', origin => {
      expect(isFirstPartyOrigin(origin)).toBe(true)
    })

    it('ignores the port when matching', () => {
      expect(isFirstPartyOrigin('https://core.app:8443')).toBe(true)
    })

    it('matches case-insensitively', () => {
      expect(isFirstPartyOrigin('https://CORE.APP')).toBe(true)
    })
  })

  describe('third-party origins (rejected)', () => {
    it.each([
      'https://pangolin.exchange',
      'https://app.uniswap.org',
      'https://example.com'
    ])('rejects %s', origin => {
      expect(isFirstPartyOrigin(origin)).toBe(false)
    })
  })

  describe('look-alike / suffix-confusion attacks (rejected)', () => {
    it.each([
      // suffix without the separating dot must not match (the classic bug)
      'https://notcore.app',
      'https://evilcore.app',
      'https://core-app.com',
      // allowlisted host as a left-label of an attacker domain
      'https://core.app.evil.com',
      'https://core.app.attacker.io',
      // no leading dot before an allowlisted domain
      'https://xavacloud.io',
      // shared multi-tenant suffixes must NOT be trusted at their bare level:
      // only *.avalabs.workers.dev / *.avacloud-app.pages.dev are first-party,
      // never any *.workers.dev or *.pages.dev (anyone can register those).
      'https://evil.workers.dev',
      'https://evil.pages.dev',
      'https://attacker.pages.dev'
    ])('rejects %s', origin => {
      expect(isFirstPartyOrigin(origin)).toBe(false)
    })
  })

  describe('malformed / missing origins', () => {
    it.each([undefined, '', 'not a url', 'http://'])('rejects %p', origin => {
      expect(isFirstPartyOrigin(origin as string | undefined)).toBe(false)
    })
  })

  describe('dev-only hosts are gated behind __DEV__', () => {
    it('trusts localhost / 127.0.0.1 in development builds', () => {
      withDev(true, () => {
        expect(isFirstPartyOrigin('https://localhost')).toBe(true)
        expect(isFirstPartyOrigin('https://localhost:3000')).toBe(true)
        expect(isFirstPartyOrigin('https://127.0.0.1')).toBe(true)
      })
    })

    it('does NOT trust localhost / 127.0.0.1 in production builds', () => {
      withDev(false, () => {
        expect(isFirstPartyOrigin('https://localhost')).toBe(false)
        expect(isFirstPartyOrigin('https://127.0.0.1')).toBe(false)
      })
      // real first-party domains stay trusted regardless of build type
      withDev(false, () => {
        expect(isFirstPartyOrigin('https://core.app')).toBe(true)
      })
    })
  })
})
