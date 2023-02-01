import { formatCurrency } from 'utils/FormatCurrency'

describe('formatCurrency function', () => {
  describe('formats normal currency', () => {
    it('Should display any number with max 2 fraction digits', () => {
      const result = formatCurrency(13245125.123424, 'USD', false)
      expect(result).toBe('$13,245,125.12')
    })

    it('Should display any number with max 2 fraction digits and round correctly', () => {
      const result = formatCurrency(13245125.126, 'USD', false)
      expect(result).toBe('$13,245,125.13')
    })

    it('Should not duplicate currency symbol if it matches currency code', () => {
      const result = formatCurrency(13245125.126, 'CHF', false)
      expect(result).toBe('13,245,125.13 CHF')
    })

    it('Should always have 2 fraction digits', () => {
      const result = formatCurrency(0.1, 'USD', false)
      expect(result).toBe('$0.10')

      const result2 = formatCurrency(100, 'USD', false)
      expect(result2).toBe('$100.00')
    })
  })

  describe('formats token as currency', () => {
    it('Should display numbers >= 1 with max 2 fraction digits', () => {
      let result = formatCurrency(13.123424352342212, 'USD', true)
      expect(result).toBe('$13.12')

      result = formatCurrency(130000.12342, 'USD', true)
      expect(result).toBe('$130,000.12')
    })

    it('Should display numbers >= 1 with min 2 fraction digits', () => {
      const result = formatCurrency(1, 'USD', true)
      expect(result).toBe('$1.00')
    })

    it('Should display numbers < 1 with min 2 fraction digits', () => {
      const result = formatCurrency(0.9, 'USD', true)
      expect(result).toBe('$0.90')
    })

    it('Should display numbers < 1 with max 8 fraction digits', () => {
      const result = formatCurrency(0.9923424352342212, 'USD', true)
      expect(result).toBe('$0.99234244')
    })
  })
})
