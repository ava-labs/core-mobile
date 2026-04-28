import { FeatureGates } from 'services/posthog/types'

jest.mock('react-native-config', () => ({
  default: { LIMITED_MODE: 'true' },
  LIMITED_MODE: 'true'
}))

describe('limitedMode', () => {
  it('forces required gates true and unwanted gates false when limited', () => {
    const {
      applyLimitedModeOverrides,
      isLimitedMode
    } = require('./limitedMode')

    expect(isLimitedMode).toBe(true)

    const input = {
      [FeatureGates.EVERYTHING]: false,
      [FeatureGates.FUSION]: false,
      [FeatureGates.MELD_OFFRAMP]: false,
      [FeatureGates.MELD_ONRAMP]: false,
      [FeatureGates.FUSION_LOMBARD_BTC_TO_BTCB]: false,
      [FeatureGates.SEEDLESS_ONBOARDING_APPLE]: true,
      [FeatureGates.SEEDLESS_ONBOARDING_GOOGLE]: false,
      [FeatureGates.GASLESS]: true,
      [FeatureGates.BRIDGE_BTC]: true
    }

    const out = applyLimitedModeOverrides(input)

    // Forced-true
    expect(out[FeatureGates.EVERYTHING]).toBe(true)
    expect(out[FeatureGates.FUSION]).toBe(true)
    expect(out[FeatureGates.SEEDLESS_ONBOARDING_GOOGLE]).toBe(true)
    expect(out[FeatureGates.MELD_ONRAMP]).toBe(true)
    expect(out[FeatureGates.MELD_OFFRAMP]).toBe(true)
    expect(out[FeatureGates.FUSION_LOMBARD_BTC_TO_BTCB]).toBe(true)
    expect(out[FeatureGates.FUSION_LOMBARD_BTCB_TO_BTC]).toBe(true)
    expect(out[FeatureGates.FUSION_MARKR]).toBe(true)
    expect(out[FeatureGates.FUSION_AVALANCHE_EVM]).toBe(true)

    // Forced-false
    expect(out[FeatureGates.BRIDGE_BTC]).toBe(false)
    expect(out[FeatureGates.LEGACY_BRIDGE]).toBe(false)
    expect(out[FeatureGates.WALLET_CONNECT]).toBe(false)
    expect(out[FeatureGates.SOLANA_SUPPORT]).toBe(false)

    // gates not in either override list pass through
    expect(out[FeatureGates.GASLESS]).toBe(true)
  })

  describe('isAllowedLimitedSwapToken', () => {
    it('returns true for each allowlisted internalId', () => {
      const { isAllowedLimitedSwapToken } = require('./limitedMode')
      const allowed = [
        'NATIVE-avax',
        'NATIVE-eth',
        'NATIVE-btc',
        'eip155:43114-0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
        'eip155:1-0xdac17f958d2ee523a2206206994597c13d831ec7',
        'eip155:43114-0x152b9d0fdc40c096757f570a51e494bd4b943e50'
      ]
      for (const internalId of allowed) {
        expect(isAllowedLimitedSwapToken({ internalId })).toBe(true)
      }
    })

    it('returns false for disallowed tokens (USDC, USDT.e)', () => {
      const { isAllowedLimitedSwapToken } = require('./limitedMode')
      // USDC on Ethereum
      expect(
        isAllowedLimitedSwapToken({
          internalId: 'eip155:1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        })
      ).toBe(false)
      // USDT.e on Avalanche
      expect(
        isAllowedLimitedSwapToken({
          internalId: 'eip155:43114-0xc7198437980c041c805a1edcba50c1ce5db95118'
        })
      ).toBe(false)
      // Solana SOL
      expect(isAllowedLimitedSwapToken({ internalId: 'NATIVE-sol' })).toBe(
        false
      )
    })

    it('returns false for null/missing internalId', () => {
      const { isAllowedLimitedSwapToken } = require('./limitedMode')
      expect(isAllowedLimitedSwapToken({})).toBe(false)
      expect(isAllowedLimitedSwapToken({ internalId: null })).toBe(false)
      expect(isAllowedLimitedSwapToken(null)).toBe(false)
    })
  })

  describe('isAllowedLimitedBuyCrypto', () => {
    it('returns true for native BTC by currencyCode', () => {
      const { isAllowedLimitedBuyCrypto } = require('./limitedMode')
      expect(isAllowedLimitedBuyCrypto({ currencyCode: 'BTC' })).toBe(true)
    })

    it('returns true for native AVAX and ETH', () => {
      const { isAllowedLimitedBuyCrypto } = require('./limitedMode')
      expect(
        isAllowedLimitedBuyCrypto({ chainId: 43114, contractAddress: '' })
      ).toBe(true)
      expect(
        isAllowedLimitedBuyCrypto({
          chainId: 1,
          contractAddress: '0x0000000000000000000000000000000000000000'
        })
      ).toBe(true)
    })

    it('returns true for the three allowlisted ERC-20s', () => {
      const { isAllowedLimitedBuyCrypto } = require('./limitedMode')
      expect(
        isAllowedLimitedBuyCrypto({
          chainId: 43114,
          contractAddress: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'
        })
      ).toBe(true)
      expect(
        isAllowedLimitedBuyCrypto({
          chainId: 1,
          contractAddress: '0xDAC17F958D2ee523a2206206994597C13D831ec7' // mixed case
        })
      ).toBe(true)
      expect(
        isAllowedLimitedBuyCrypto({
          chainId: 43114,
          contractAddress: '0x152b9d0fdc40c096757f570a51e494bd4b943e50'
        })
      ).toBe(true)
    })

    it('returns false for SOL, USDC, and DAI', () => {
      const { isAllowedLimitedBuyCrypto } = require('./limitedMode')
      expect(isAllowedLimitedBuyCrypto({ currencyCode: 'SOL' })).toBe(false)
      // USDC on Ethereum
      expect(
        isAllowedLimitedBuyCrypto({
          chainId: 1,
          contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        })
      ).toBe(false)
      // DAI on Ethereum
      expect(
        isAllowedLimitedBuyCrypto({
          chainId: 1,
          contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f'
        })
      ).toBe(false)
    })

    it('returns false for null/missing input', () => {
      const { isAllowedLimitedBuyCrypto } = require('./limitedMode')
      expect(isAllowedLimitedBuyCrypto(null)).toBe(false)
      expect(isAllowedLimitedBuyCrypto(undefined)).toBe(false)
    })
  })
})

describe('limitedMode disabled', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.doMock('react-native-config', () => ({
      default: { LIMITED_MODE: undefined },
      LIMITED_MODE: undefined
    }))
  })

  it('is a no-op for applyLimitedModeOverrides when env var is not set', () => {
    const {
      applyLimitedModeOverrides,
      isLimitedMode
    } = require('./limitedMode')

    expect(isLimitedMode).toBe(false)

    const input = {
      [FeatureGates.EVERYTHING]: true,
      [FeatureGates.MELD_OFFRAMP]: false
    }
    expect(applyLimitedModeOverrides(input)).toBe(input)
  })

  it('isAllowedLimitedSwapToken returns true for any token when env unset', () => {
    const { isAllowedLimitedSwapToken } = require('./limitedMode')
    expect(isAllowedLimitedSwapToken({ internalId: 'something-arbitrary' })).toBe(
      true
    )
    expect(isAllowedLimitedSwapToken({})).toBe(true)
    expect(isAllowedLimitedSwapToken(null)).toBe(true)
  })

  it('isAllowedLimitedBuyCrypto returns true for any crypto when env unset', () => {
    const { isAllowedLimitedBuyCrypto } = require('./limitedMode')
    expect(isAllowedLimitedBuyCrypto({ currencyCode: 'SOL' })).toBe(true)
    expect(
      isAllowedLimitedBuyCrypto({
        chainId: 1,
        contractAddress: '0xdeadbeef'
      })
    ).toBe(true)
    expect(isAllowedLimitedBuyCrypto(null)).toBe(true)
  })
})
