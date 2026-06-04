import {
  estimateLiquidationPrice,
  formatSigned,
  isTriggerValid,
  pctFromEntry,
  pnlColor,
  positionSizeTokens,
  projectedPnl,
  sanitizeDecimalInput
} from './economics'

const COLORS = { $textSuccess: 'green', $textDanger: 'red' }

describe('estimateLiquidationPrice', () => {
  it('is below entry for a long, above for a short', () => {
    expect(estimateLiquidationPrice(100, 2, true)).toBe(50)
    expect(estimateLiquidationPrice(100, 2, false)).toBe(150)
  })

  it('moves closer to entry as leverage rises', () => {
    expect(estimateLiquidationPrice(100, 10, true)).toBe(90)
  })

  it('returns entry for non-positive leverage', () => {
    expect(estimateLiquidationPrice(100, 0, true)).toBe(100)
  })
})

describe('positionSizeTokens', () => {
  it('is collateral × leverage / entry', () => {
    expect(positionSizeTokens(100, 2, 50)).toBe(4)
  })

  it('is 0 when entry is non-positive', () => {
    expect(positionSizeTokens(100, 2, 0)).toBe(0)
  })
})

describe('projectedPnl', () => {
  it('is positive for a long closed above entry', () => {
    expect(
      projectedPnl({
        exitPrice: 110,
        entryPrice: 100,
        sizeTokens: 2,
        isLong: true
      })
    ).toBe(20)
  })

  it('is positive for a short closed below entry', () => {
    expect(
      projectedPnl({
        exitPrice: 90,
        entryPrice: 100,
        sizeTokens: 2,
        isLong: false
      })
    ).toBe(20)
  })

  it('is negative for a long closed below entry', () => {
    expect(
      projectedPnl({
        exitPrice: 90,
        entryPrice: 100,
        sizeTokens: 2,
        isLong: true
      })
    ).toBe(-20)
  })
})

describe('pctFromEntry', () => {
  it('computes signed percentage', () => {
    expect(pctFromEntry(110, 100)).toBeCloseTo(10)
    expect(pctFromEntry(95, 100)).toBeCloseTo(-5)
  })

  it('is 0 when entry is non-positive', () => {
    expect(pctFromEntry(110, 0)).toBe(0)
  })
})

describe('pnlColor', () => {
  it('maps sign to colors, neutral at zero/undefined', () => {
    expect(pnlColor(5, COLORS, 'neutral')).toBe('green')
    expect(pnlColor(-5, COLORS, 'neutral')).toBe('red')
    expect(pnlColor(0, COLORS, 'neutral')).toBe('neutral')
    expect(pnlColor(undefined, COLORS, 'neutral')).toBe('neutral')
  })
})

describe('sanitizeDecimalInput', () => {
  it('strips non-numeric characters but keeps digits and dots', () => {
    expect(sanitizeDecimalInput('1a2.3b')).toBe('12.3')
    expect(sanitizeDecimalInput('$1,234.50')).toBe('1234.50')
  })
})

describe('formatSigned', () => {
  const fmt = (amount: number): string => `$${amount}`

  it('prefixes + for positives, - for negatives', () => {
    expect(formatSigned(5, fmt)).toBe('+$5')
    expect(formatSigned(-5, fmt)).toBe('-$5')
  })

  it('omits the leading + when alwaysSign is false', () => {
    expect(formatSigned(5, fmt, { alwaysSign: false })).toBe('$5')
    expect(formatSigned(-5, fmt, { alwaysSign: false })).toBe('-$5')
  })
})

describe('isTriggerValid', () => {
  const entryPrice = 100

  it('take-profit must be above entry for a long, below for a short', () => {
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: true,
        price: 110,
        entryPrice
      })
    ).toBe(true)
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: true,
        price: 90,
        entryPrice
      })
    ).toBe(false)
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: false,
        price: 90,
        entryPrice
      })
    ).toBe(true)
  })

  it('stop-loss must be below entry for a long, above for a short', () => {
    expect(
      isTriggerValid({ kind: 'stopLoss', isLong: true, price: 90, entryPrice })
    ).toBe(true)
    expect(
      isTriggerValid({ kind: 'stopLoss', isLong: true, price: 110, entryPrice })
    ).toBe(false)
    expect(
      isTriggerValid({
        kind: 'stopLoss',
        isLong: false,
        price: 110,
        entryPrice
      })
    ).toBe(true)
  })

  it('rejects undefined / non-positive prices', () => {
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: true,
        price: undefined,
        entryPrice
      })
    ).toBe(false)
    expect(
      isTriggerValid({ kind: 'takeProfit', isLong: true, price: 0, entryPrice })
    ).toBe(false)
  })
})
