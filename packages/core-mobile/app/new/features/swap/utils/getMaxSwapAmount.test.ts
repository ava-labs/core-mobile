import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import { getMaxSwapAmount } from './getMaxSwapAmount'

describe('getMaxSwapAmount', () => {
  describe('when fromToken is undefined', () => {
    it('should return undefined', () => {
      const result = getMaxSwapAmount({ fromToken: undefined, gasCost: 100n })
      expect(result).toBeUndefined()
    })
  })

  describe('when fromToken has no balance', () => {
    it('should return undefined', () => {
      const fromToken = {
        type: TokenType.NATIVE,
        balance: undefined
      } as unknown as LocalTokenWithBalance

      const result = getMaxSwapAmount({ fromToken, gasCost: 100n })
      expect(result).toBeUndefined()
    })

    it('should return undefined for zero balance', () => {
      const fromToken = {
        type: TokenType.NATIVE,
        balance: 0n
      } as unknown as LocalTokenWithBalance

      const result = getMaxSwapAmount({ fromToken, gasCost: 100n })
      expect(result).toBeUndefined()
    })
  })

  describe('when fromToken is ERC20', () => {
    it('should return full balance', () => {
      const fromToken = {
        type: TokenType.ERC20,
        balance: 1000n
      } as unknown as LocalTokenWithBalance

      const result = getMaxSwapAmount({ fromToken, gasCost: 100n })
      expect(result).toBe(1000n)
    })

    it('should return full balance regardless of gasCost', () => {
      const fromToken = {
        type: TokenType.ERC20,
        balance: 500n
      } as unknown as LocalTokenWithBalance

      const result = getMaxSwapAmount({ fromToken, gasCost: 1000n })
      expect(result).toBe(500n)
    })
  })

  describe('when fromToken is SPL', () => {
    it('should return full balance', () => {
      const fromToken = {
        type: TokenType.SPL,
        balance: 2000n
      } as unknown as LocalTokenWithBalance

      const result = getMaxSwapAmount({ fromToken, gasCost: 200n })
      expect(result).toBe(2000n)
    })
  })

  describe('when fromToken is NATIVE', () => {
    it('should return balance minus gasCost', () => {
      const fromToken = {
        type: TokenType.NATIVE,
        balance: 1000n
      } as unknown as LocalTokenWithBalance

      const result = getMaxSwapAmount({ fromToken, gasCost: 100n })
      expect(result).toBe(900n)
    })

    it('should return 0 when gasCost exceeds balance', () => {
      const fromToken = {
        type: TokenType.NATIVE,
        balance: 100n
      } as unknown as LocalTokenWithBalance

      const result = getMaxSwapAmount({ fromToken, gasCost: 200n })
      expect(result).toBe(0n)
    })

    it('should return 0 when gasCost equals balance', () => {
      const fromToken = {
        type: TokenType.NATIVE,
        balance: 100n
      } as unknown as LocalTokenWithBalance

      const result = getMaxSwapAmount({ fromToken, gasCost: 100n })
      expect(result).toBe(0n)
    })

    it('should treat undefined gasCost as 0', () => {
      const fromToken = {
        type: TokenType.NATIVE,
        balance: 1000n
      } as unknown as LocalTokenWithBalance

      const result = getMaxSwapAmount({ fromToken, gasCost: undefined })
      expect(result).toBe(1000n)
    })
  })
})
