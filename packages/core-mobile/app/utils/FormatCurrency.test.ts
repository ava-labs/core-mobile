import { formatCurrency } from 'utils/FormatCurrency'

describe('formatCurrency function', () => {
  describe('formats normal currency', () => {
    it('Should display any number with max 2 fraction digits', () => {
      const result = formatCurrency({
        amount: 13245125.123424,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
      expect(result).toBe('$13,245,125.12')
    })

    it('Should display any number with max 2 fraction digits and round correctly', () => {
      const result = formatCurrency({
        amount: 13245125.126,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
      expect(result).toBe('$13,245,125.13')
    })

    it('Should not duplicate currency symbol if it matches currency code', () => {
      const result = formatCurrency({
        amount: 13245125.126,
        currency: 'CHF',
        boostSmallNumberPrecision: false
      })
      expect(result).toBe('13,245,125.13 CHF')
    })

    it('Should always have 2 fraction digits', () => {
      const result = formatCurrency({
        amount: 0.1,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
      expect(result).toBe('$0.10')

      const result2 = formatCurrency({
        amount: 100,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
      expect(result2).toBe('$100.00')
    })
  })

  describe('formats token as currency', () => {
    it('Should display numbers >= 1 with max 2 fraction digits', () => {
      let result = formatCurrency({
        amount: 13.123424352342212,
        currency: 'USD',
        boostSmallNumberPrecision: true
      })
      expect(result).toBe('$13.12')

      result = formatCurrency({
        amount: 130000.12342,
        currency: 'USD',
        boostSmallNumberPrecision: true
      })
      expect(result).toBe('$130,000.12')
    })

    it('Should display numbers >= 1 with min 2 fraction digits', () => {
      const result = formatCurrency({
        amount: 1,
        currency: 'USD',
        boostSmallNumberPrecision: true
      })
      expect(result).toBe('$1.00')
    })

    it('Should display numbers < 1 with min 2 fraction digits', () => {
      const result = formatCurrency({
        amount: 0.9,
        currency: 'USD',
        boostSmallNumberPrecision: true
      })
      expect(result).toBe('$0.90')
    })

    it('Should display numbers < 1 with max 8 fraction digits', () => {
      const result = formatCurrency({
        amount: 0.9923424352342212,
        currency: 'USD',
        boostSmallNumberPrecision: true
      })
      expect(result).toBe('$0.99234244')
    })
  })
})
