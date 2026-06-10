import { CORE_MOBILE_META } from '../types'
import { isDappOriginatedUrl } from './isDappOriginatedRequest'

describe('isDappOriginatedUrl', () => {
  it('returns true for a real dApp url (WalletConnect or injected browser)', () => {
    expect(isDappOriginatedUrl('https://test.dapp.com')).toBe(true)
    expect(isDappOriginatedUrl('https://app.uniswap.org')).toBe(true)
  })

  it('returns false for the wallet-internal CORE_MOBILE_META url', () => {
    expect(isDappOriginatedUrl(CORE_MOBILE_META.url)).toBe(false)
    expect(isDappOriginatedUrl('https://core.app/')).toBe(false)
  })

  it('returns false for an empty url (getPeerMeta placeholder)', () => {
    expect(isDappOriginatedUrl('')).toBe(false)
  })

  it('returns false for an undefined url', () => {
    expect(isDappOriginatedUrl(undefined)).toBe(false)
  })

  // Documents the known limitation: the real core.app dApp collides with the
  // CORE_MOBILE_META internal marker and is treated as wallet-internal. A path
  // under core.app does NOT collide.
  it('treats the exact core.app root as internal, but not a sub-path', () => {
    expect(isDappOriginatedUrl('https://core.app/')).toBe(false)
    expect(isDappOriginatedUrl('https://core.app/stake')).toBe(true)
  })
})
