import { formatCurrency } from 'utils/FormatCurrency'

describe('formats normal numbers', () => {
  it('should display any number with max 2 fraction digits', () => {
    expect(
      formatCurrency({
        amount: 13245125.123424,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
    ).toBe('$13,245,125.12')

    expect(
      formatCurrency({
        amount: 13245125.126,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
    ).toBe('$13,245,125.13')

    expect(
      formatCurrency({
        amount: 0.1,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
    ).toBe('$0.10')

    expect(
      formatCurrency({
        amount: 100,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
    ).toBe('$100.00')
  })

  it('should not duplicate currency symbol if it matches currency code', () => {
    const result = formatCurrency({
      amount: 13245125.126,
      currency: 'CHF',
      boostSmallNumberPrecision: false
    })
    expect(result).toBe('13,245,125.13 CHF')
  })
})

describe('formats small numbers with boostSmallNumberPrecision', () => {
  it('should display numbers >= 1 with max 2 fraction digits', () => {
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

  it('should display numbers >= 1 with min 2 fraction digits', () => {
    const result = formatCurrency({
      amount: 1,
      currency: 'USD',
      boostSmallNumberPrecision: true
    })
    expect(result).toBe('$1.00')
  })

  it('should display numbers < 1 with min 2 fraction digits', () => {
    expect(
      formatCurrency({
        amount: 0.9,
        currency: 'USD',
        boostSmallNumberPrecision: true
      })
    ).toBe('$0.90')

    expect(
      formatCurrency({
        amount: 0.1,
        currency: 'USD',
        boostSmallNumberPrecision: true
      })
    ).toBe('$0.10')
  })

  it('should display numbers < 1 with max 8 fraction digits', () => {
    const result = formatCurrency({
      amount: 0.9923424352342212,
      currency: 'USD',
      boostSmallNumberPrecision: true
    })
    expect(result).toBe('$0.99234244')
  })
})

describe('formats small numbers', () => {
  it('should display amounts between 0.001 and 0.01 with 3 decimal places (tenths of cents)', () => {
    expect(
      formatCurrency({
        amount: 0.005,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
    ).toBe('$0.005')

    expect(
      formatCurrency({
        amount: 0.009,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
    ).toBe('$0.009')

    expect(
      formatCurrency({
        amount: 0.001,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
    ).toBe('$0.001')
  })

  it('should handle amounts < 0.001', () => {
    expect(
      formatCurrency({
        amount: 0.0005,
        currency: 'USD',
        boostSmallNumberPrecision: false,
        showLessThanThreshold: true
      })
    ).toBe('<$0.001')

    expect(
      formatCurrency({
        amount: 0.00001,
        currency: 'USD',
        boostSmallNumberPrecision: false,
        showLessThanThreshold: true
      })
    ).toBe('<$0.001')

    expect(
      formatCurrency({
        amount: 0.0005,
        currency: 'USD',
        boostSmallNumberPrecision: false,
        showLessThanThreshold: false
      })
    ).toBe('$0.001')
  })
})

describe('formats negative numbers', () => {
  it('should format negative numbers correctly with appropriate decimal places', () => {
    expect(
      formatCurrency({
        amount: -5.6789,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
    ).toBe('-$5.68')

    expect(
      formatCurrency({
        amount: -0.009,
        currency: 'USD',
        boostSmallNumberPrecision: false
      })
    ).toBe('-$0.009')

    expect(
      formatCurrency({
        amount: -0.0005,
        currency: 'USD',
        boostSmallNumberPrecision: false,
        showLessThanThreshold: true
      })
    ).toBe('<$0.001')
  })
})

describe('handles compact notation', () => {
  it('should display large numbers in compact notation when specified', () => {
    expect(
      formatCurrency({
        amount: 1234567,
        currency: 'USD',
        boostSmallNumberPrecision: false,
        notation: 'compact'
      })
    ).toBe('$1.23M')

    expect(
      formatCurrency({
        amount: 987654321,
        currency: 'USD',
        boostSmallNumberPrecision: false,
        notation: 'compact'
      })
    ).toBe('$987.65M')
  })
})
