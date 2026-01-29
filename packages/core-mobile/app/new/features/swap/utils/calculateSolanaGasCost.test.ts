import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import { SOL_BASE_TX_FEE_PER_SIG, SOL_BASE_RENT_FEE } from '../consts'
import { calculateSolanaGasCost } from './calculateSolanaGasCost'

describe('calculateSolanaGasCost', () => {
  const createNativeToken = (balance: bigint): LocalTokenWithBalance =>
    ({
      type: TokenType.NATIVE,
      balance
    } as unknown as LocalTokenWithBalance)

  const createSplToken = (): LocalTokenWithBalance =>
    ({
      type: TokenType.SPL,
      balance: 1000n
    } as unknown as LocalTokenWithBalance)

  describe('when fromToken is undefined', () => {
    it('should return undefined', () => {
      const result = calculateSolanaGasCost({
        fromToken: undefined,
        toToken: undefined
      })
      expect(result).toBeUndefined()
    })
  })

  describe('when fromToken is not NATIVE', () => {
    it('should return undefined for SPL token', () => {
      const result = calculateSolanaGasCost({
        fromToken: createSplToken(),
        toToken: undefined
      })
      expect(result).toBeUndefined()
    })
  })

  describe('when fromToken is NATIVE (SOL)', () => {
    const balance = 1_000_000_000n // 1 SOL in lamports
    const feeBuffer = balance / 100n // 1% buffer

    it('should include base tx fee and wrapped SOL ATA rent when ATA does not exist', () => {
      const result = calculateSolanaGasCost({
        fromToken: createNativeToken(balance),
        toToken: undefined,
        wrappedSolAtaExists: false
      })

      const expected = SOL_BASE_TX_FEE_PER_SIG + SOL_BASE_RENT_FEE + feeBuffer
      expect(result).toBe(expected)
    })

    it('should exclude wrapped SOL ATA rent when ATA exists', () => {
      const result = calculateSolanaGasCost({
        fromToken: createNativeToken(balance),
        toToken: undefined,
        wrappedSolAtaExists: true
      })

      const expected = SOL_BASE_TX_FEE_PER_SIG + feeBuffer
      expect(result).toBe(expected)
    })

    it('should add buffer for SPL destination when toToken ATA does not exist', () => {
      const result = calculateSolanaGasCost({
        fromToken: createNativeToken(balance),
        toToken: createSplToken(),
        wrappedSolAtaExists: true,
        toTokenAtaExists: false
      })

      // base fee + 2x intermediate buffer + destination ATA rent + 1% buffer
      const expected =
        SOL_BASE_TX_FEE_PER_SIG +
        SOL_BASE_RENT_FEE * 2n +
        SOL_BASE_RENT_FEE +
        feeBuffer
      expect(result).toBe(expected)
    })

    it('should exclude destination ATA rent when toToken ATA exists', () => {
      const result = calculateSolanaGasCost({
        fromToken: createNativeToken(balance),
        toToken: createSplToken(),
        wrappedSolAtaExists: true,
        toTokenAtaExists: true
      })

      // base fee + 2x intermediate buffer + 1% buffer (no destination ATA rent)
      const expected =
        SOL_BASE_TX_FEE_PER_SIG + SOL_BASE_RENT_FEE * 2n + feeBuffer
      expect(result).toBe(expected)
    })

    it('should conservatively estimate when ATA existence is unknown', () => {
      const result = calculateSolanaGasCost({
        fromToken: createNativeToken(balance),
        toToken: createSplToken()
        // wrappedSolAtaExists and toTokenAtaExists are undefined
      })

      // All fees included (conservative estimate)
      const expected =
        SOL_BASE_TX_FEE_PER_SIG +
        SOL_BASE_RENT_FEE + // wrapped SOL ATA
        SOL_BASE_RENT_FEE * 2n + // intermediate buffer
        SOL_BASE_RENT_FEE + // destination ATA
        feeBuffer
      expect(result).toBe(expected)
    })
  })
})
