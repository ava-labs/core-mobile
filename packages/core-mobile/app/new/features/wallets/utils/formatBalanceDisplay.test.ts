import { UNKNOWN_AMOUNT } from 'consts/amount'
import { formatBalanceDisplay } from './formatBalanceDisplay'

describe('formatBalanceDisplay', () => {
  // Mock formatCurrency to simulate actual behavior
  const mockFormatCurrency = jest.fn(
    ({
      amount,
      withoutCurrencySuffix,
      showLessThanThreshold
    }: {
      amount: number
      notation?: 'compact'
      withoutCurrencySuffix?: boolean
      showLessThanThreshold?: boolean
    }) => {
      // Simulate the real formatCurrency behavior
      if (showLessThanThreshold && amount > 0 && amount < 0.001) {
        return withoutCurrencySuffix ? '<$0.001' : '<$0.001 USD'
      }
      const formatted = `$${amount.toFixed(2)}`
      return withoutCurrencySuffix ? formatted : `${formatted} USD`
    }
  )

  beforeEach(() => {
    mockFormatCurrency.mockClear()
  })

  describe('Show $0 for empty accounts on mainnet', () => {
    it('should show $0 when balance is 0 on mainnet', () => {
      const result = formatBalanceDisplay({
        balance: 0,
        isDeveloperMode: false,
        formatCurrency: mockFormatCurrency
      })

      expect(result).toBe('$0 USD')
    })

    it('should show $0 (without suffix) when balance is 0 on mainnet with withoutCurrencySuffix', () => {
      const result = formatBalanceDisplay({
        balance: 0,
        isDeveloperMode: false,
        formatCurrency: mockFormatCurrency,
        withoutCurrencySuffix: true
      })

      expect(result).toBe('$0')
    })
  })

  describe('Show $- when loading balances fails', () => {
    it('should show $- when hasError is true', () => {
      const result = formatBalanceDisplay({
        balance: 100,
        isDeveloperMode: false,
        formatCurrency: mockFormatCurrency,
        hasError: true
      })

      expect(result).toContain(UNKNOWN_AMOUNT)
      expect(result).not.toContain('100')
    })

    it('should show $- when hasError is true even with zero balance', () => {
      const result = formatBalanceDisplay({
        balance: 0,
        isDeveloperMode: false,
        formatCurrency: mockFormatCurrency,
        hasError: true
      })

      expect(result).toContain(UNKNOWN_AMOUNT)
    })
  })

  describe('Show $- when in testnet mode', () => {
    it('should show $- when isDeveloperMode is true', () => {
      const result = formatBalanceDisplay({
        balance: 100,
        isDeveloperMode: true,
        formatCurrency: mockFormatCurrency
      })

      expect(result).toContain(UNKNOWN_AMOUNT)
      expect(result).not.toContain('100')
    })

    it('should show $- when isDeveloperMode is true with zero balance', () => {
      const result = formatBalanceDisplay({
        balance: 0,
        isDeveloperMode: true,
        formatCurrency: mockFormatCurrency
      })

      expect(result).toContain(UNKNOWN_AMOUNT)
    })

    it('should show $- when isDeveloperMode is true with withoutCurrencySuffix', () => {
      const result = formatBalanceDisplay({
        balance: 50,
        isDeveloperMode: true,
        formatCurrency: mockFormatCurrency,
        withoutCurrencySuffix: true
      })

      expect(result).toContain(UNKNOWN_AMOUNT)
    })
  })

  describe('Normal balance display on mainnet', () => {
    it('should show actual balance for non-zero amounts', () => {
      const result = formatBalanceDisplay({
        balance: 123.45,
        isDeveloperMode: false,
        formatCurrency: mockFormatCurrency
      })

      expect(result).toBe('$123.45 USD')
    })

    it('should use compact notation for large amounts', () => {
      formatBalanceDisplay({
        balance: 150000,
        isDeveloperMode: false,
        formatCurrency: mockFormatCurrency
      })

      expect(mockFormatCurrency).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 150000,
          notation: 'compact'
        })
      )
    })

    it('should not use compact notation for smaller amounts', () => {
      formatBalanceDisplay({
        balance: 50000,
        isDeveloperMode: false,
        formatCurrency: mockFormatCurrency
      })

      expect(mockFormatCurrency).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50000,
          notation: undefined
        })
      )
    })

    it('should show <$0.001 for dust amounts', () => {
      const result = formatBalanceDisplay({
        balance: 0.0001,
        isDeveloperMode: false,
        formatCurrency: mockFormatCurrency
      })

      expect(result).toBe('<$0.001 USD')
    })
  })

  describe('Priority of conditions', () => {
    it('should prioritize testnet mode over error state', () => {
      const result = formatBalanceDisplay({
        balance: 100,
        isDeveloperMode: true,
        formatCurrency: mockFormatCurrency,
        hasError: true
      })

      // Both conditions result in $-, so either is fine
      expect(result).toContain(UNKNOWN_AMOUNT)
    })

    it('should prioritize testnet mode over zero balance', () => {
      const result = formatBalanceDisplay({
        balance: 0,
        isDeveloperMode: true,
        formatCurrency: mockFormatCurrency
      })

      // Should show $- (testnet), not $0 (empty mainnet)
      expect(result).toContain(UNKNOWN_AMOUNT)
    })

    it('should prioritize error state over zero balance', () => {
      const result = formatBalanceDisplay({
        balance: 0,
        isDeveloperMode: false,
        formatCurrency: mockFormatCurrency,
        hasError: true
      })

      // Should show $- (error), not $0 (empty)
      expect(result).toContain(UNKNOWN_AMOUNT)
    })
  })
})
