import { ChainId } from '@avalabs/core-chains-sdk'
import { UI, isUIDisabledForNetwork } from './isUIDisabled'

describe('isUIDisabledForNetwork', () => {
  describe('chainId is undefined', () => {
    it('returns false regardless of UI type', () => {
      expect(isUIDisabledForNetwork(UI.Bridge, undefined)).toBe(false)
      expect(isUIDisabledForNetwork(UI.Swap, undefined)).toBe(false)
    })
  })

  describe('UI.Swap', () => {
    it('returns true (disabled) for P-Chain', () => {
      expect(isUIDisabledForNetwork(UI.Swap, ChainId.AVALANCHE_P)).toBe(true)
    })

    it('returns true (disabled) for X-Chain', () => {
      expect(isUIDisabledForNetwork(UI.Swap, ChainId.AVALANCHE_X)).toBe(true)
    })

    it('returns false (enabled) for C-Chain', () => {
      expect(
        isUIDisabledForNetwork(UI.Swap, ChainId.AVALANCHE_MAINNET_ID)
      ).toBe(false)
    })

    it('returns false (enabled) for an arbitrary EVM chain', () => {
      const arbitraryChainId = 1 // Ethereum mainnet
      expect(isUIDisabledForNetwork(UI.Swap, arbitraryChainId)).toBe(false)
    })
  })

  describe('UI.Bridge', () => {
    it('returns true (disabled) for DFK', () => {
      expect(isUIDisabledForNetwork(UI.Bridge, ChainId.DFK)).toBe(true)
    })

    it('returns true (disabled) for DFK testnet', () => {
      expect(isUIDisabledForNetwork(UI.Bridge, ChainId.DFK_TESTNET)).toBe(true)
    })

    it('returns true (disabled) for Swimmer', () => {
      expect(isUIDisabledForNetwork(UI.Bridge, ChainId.SWIMMER)).toBe(true)
    })

    it('returns true (disabled) for Swimmer testnet', () => {
      expect(isUIDisabledForNetwork(UI.Bridge, ChainId.SWIMMER_TESTNET)).toBe(
        true
      )
    })

    it('returns false (enabled) for C-Chain', () => {
      expect(
        isUIDisabledForNetwork(UI.Bridge, ChainId.AVALANCHE_MAINNET_ID)
      ).toBe(false)
    })

    it('returns false (enabled) for P-Chain', () => {
      // P-Chain is not in the Bridge blacklist
      expect(isUIDisabledForNetwork(UI.Bridge, ChainId.AVALANCHE_P)).toBe(false)
    })
  })
})
