import { RpcRequest } from '@avalabs/vm-module-types'
import { CORE_MOBILE_META, CORE_MOBILE_TOPIC } from '../types'
import {
  isDappOriginatedUrl,
  isInjectedDappRequest
} from './isDappOriginatedRequest'

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

describe('isInjectedDappRequest', () => {
  const makeRequest = (sessionId: string, url?: string): RpcRequest =>
    ({
      requestId: 'req-1',
      sessionId,
      dappInfo: url === undefined ? undefined : { name: 'd', url, icon: '' }
    } as unknown as RpcRequest)

  it('returns true for the injected browser (real url + in-app topic)', () => {
    expect(
      isInjectedDappRequest(
        makeRequest(CORE_MOBILE_TOPIC, 'https://app.uniswap.org')
      )
    ).toBe(true)
  })

  it('returns false for WalletConnect (real url, but NOT in-app topic)', () => {
    expect(
      isInjectedDappRequest(
        makeRequest('wc-topic-abc123', 'https://app.uniswap.org')
      )
    ).toBe(false)
  })

  it('returns false for wallet-internal flows (in-app topic, but CORE_MOBILE_META url)', () => {
    expect(
      isInjectedDappRequest(
        makeRequest(CORE_MOBILE_TOPIC, CORE_MOBILE_META.url)
      )
    ).toBe(false)
  })

  it('returns false when the in-app request carries no origin url', () => {
    expect(isInjectedDappRequest(makeRequest(CORE_MOBILE_TOPIC))).toBe(false)
  })
})
