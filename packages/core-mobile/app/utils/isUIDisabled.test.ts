import { ChainId } from '@avalabs/core-chains-sdk'
import { UI, isUIDisabledForNetwork } from './isUIDisabled'

describe('isUIDisabledForNetwork', () => {
  describe('chainId is undefined', () => {
    it('returns false regardless of UI type', () => {
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
})
