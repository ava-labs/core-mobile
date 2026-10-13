import {
  resolveReceiveAmount,
  ResolveReceiveAmountParams
} from './resolveReceiveAmount'

// Sensible defaults for a populated one-time quote; each test overrides only
// the fields it cares about.
const base: ResolveReceiveAmountParams = {
  isRecurring: false,
  fromTokenValue: 1_000_000n,
  recurringAmountOut: undefined,
  hasActiveQuote: true,
  activeQuoteAmountOut: 9_000_000n,
  debouncedFromTokenValue: 1_000_000n,
  isCctRecovery: false
}

describe('resolveReceiveAmount', () => {
  describe('recurring mode', () => {
    it('sets the received amount from the recurring quote (the bug fix)', () => {
      // Regression guard: with recurring on, the received amount must track the
      // recurring quote's first-fill estimate — NOT the frozen one-time quote.
      expect(
        resolveReceiveAmount({
          ...base,
          isRecurring: true,
          recurringAmountOut: 8_500_000n,
          // Stale one-time quote that must be ignored while recurring is on.
          activeQuoteAmountOut: 9_000_000n
        })
      ).toEqual({ type: 'set', value: 8_500_000n })
    })

    it('clears when there is no pay amount entered', () => {
      expect(
        resolveReceiveAmount({
          ...base,
          isRecurring: true,
          fromTokenValue: undefined,
          recurringAmountOut: 8_500_000n
        })
      ).toEqual({ type: 'clear' })
    })

    it('keeps the prior value while the recurring quote is refetching', () => {
      // amountOut briefly undefined mid-refetch → avoid flashing empty.
      expect(
        resolveReceiveAmount({
          ...base,
          isRecurring: true,
          fromTokenValue: 2_000_000n,
          recurringAmountOut: undefined
        })
      ).toEqual({ type: 'keep' })
    })

    it('ignores the one-time quote entirely when recurring is on', () => {
      // No recurring amountOut yet + no pay amount still clears, regardless of
      // a present activeQuote.
      expect(
        resolveReceiveAmount({
          ...base,
          isRecurring: true,
          fromTokenValue: undefined,
          recurringAmountOut: undefined,
          hasActiveQuote: true,
          activeQuoteAmountOut: 9_000_000n
        })
      ).toEqual({ type: 'clear' })
    })
  })

  describe('one-time mode (unchanged behavior)', () => {
    it('sets the received amount from the active quote', () => {
      expect(resolveReceiveAmount(base)).toEqual({
        type: 'set',
        value: 9_000_000n
      })
    })

    it('clears when there is no active quote', () => {
      expect(resolveReceiveAmount({ ...base, hasActiveQuote: false })).toEqual({
        type: 'clear'
      })
    })

    it('clears when the amount is empty and it is not a CCT recovery', () => {
      expect(
        resolveReceiveAmount({
          ...base,
          debouncedFromTokenValue: undefined,
          isCctRecovery: false
        })
      ).toEqual({ type: 'clear' })
    })

    it('keeps the current value when a CCT recovery has a zero amount', () => {
      // amountIn 0 → recovery quote; original code left the To visible when
      // amountOut was falsy.
      expect(
        resolveReceiveAmount({
          ...base,
          debouncedFromTokenValue: 0n,
          isCctRecovery: true,
          activeQuoteAmountOut: undefined
        })
      ).toEqual({ type: 'keep' })
    })

    it('sets the received amount for a CCT recovery with a real amountOut', () => {
      expect(
        resolveReceiveAmount({
          ...base,
          debouncedFromTokenValue: 0n,
          isCctRecovery: true,
          activeQuoteAmountOut: 5_000_000n
        })
      ).toEqual({ type: 'set', value: 5_000_000n })
    })

    it('keeps the current value when the active quote has no amountOut', () => {
      expect(
        resolveReceiveAmount({ ...base, activeQuoteAmountOut: undefined })
      ).toEqual({ type: 'keep' })
    })
  })
})
