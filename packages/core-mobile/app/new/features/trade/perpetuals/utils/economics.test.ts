import {
  estimateLiquidationPrice,
  estimateLiquidationPriceFromMargin,
  floorToDecimals,
  formatSigned,
  maxRemovableMarginUsd,
  isTriggerValid,
  pctFromEntry,
  pnlColor,
  positionSizeTokens,
  projectedPnl,
  requiredTriggerSide,
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

  it('omits the maintenance-margin term when maxLeverage is unknown', () => {
    // No maxLeverage → zero-maintenance bound (entry ± entry/leverage).
    expect(estimateLiquidationPrice(100, 10, true)).toBeCloseTo(90, 6)
    expect(estimateLiquidationPrice(100, 10, false)).toBeCloseTo(110, 6)
  })

  it('accounts for maintenance margin, moving the estimate toward entry', () => {
    // 10× on a 10×-max coin: mmf = 1 / (2 · 10) = 0.05.
    // long:  100 · (1 − 0.1) / (1 − 0.05) = 94.7368…
    expect(estimateLiquidationPrice(100, 10, true, 10)).toBeCloseTo(94.7368, 3)
    // short: 100 · (1 + 0.1) / (1 + 0.05) = 104.7619…
    expect(estimateLiquidationPrice(100, 10, false, 10)).toBeCloseTo(
      104.7619,
      3
    )
  })

  it('gives less buffer at max leverage than the zero-maintenance bound', () => {
    const withMm = estimateLiquidationPrice(100, 10, true, 10)
    const withoutMm = estimateLiquidationPrice(100, 10, true)
    // Real liquidation is closer to entry (higher for a long) → smaller buffer.
    expect(withMm).toBeGreaterThan(withoutMm)
  })
})

describe('estimateLiquidationPriceFromMargin', () => {
  // 10× long at $100 entry, $1000 notional, $100 margin on a 10×-max coin:
  // mmf = 0.05, buffer = 0.1 − 0.05 = 0.05 → liq = 100 · (1 − 0.05/0.95).
  it('matches the leverage-based estimate when margin = notional/leverage', () => {
    const fromMargin = estimateLiquidationPriceFromMargin({
      entryPrice: 100,
      isLong: true,
      maxLeverage: 10,
      notionalUsd: 1000,
      marginUsd: 100
    })
    expect(fromMargin).toBeCloseTo(estimateLiquidationPrice(100, 10, true, 10))
  })

  it('moves a long liquidation down when margin is added', () => {
    const base = {
      entryPrice: 100,
      isLong: true,
      maxLeverage: 10,
      notionalUsd: 1000
    }
    const before = estimateLiquidationPriceFromMargin({
      ...base,
      marginUsd: 100
    })
    const after = estimateLiquidationPriceFromMargin({
      ...base,
      marginUsd: 200
    })
    expect(after).toBeLessThan(before)
  })

  it('moves a short liquidation up when margin is added', () => {
    const base = {
      entryPrice: 100,
      isLong: false,
      maxLeverage: 10,
      notionalUsd: 1000
    }
    const before = estimateLiquidationPriceFromMargin({
      ...base,
      marginUsd: 100
    })
    const after = estimateLiquidationPriceFromMargin({
      ...base,
      marginUsd: 200
    })
    expect(after).toBeGreaterThan(before)
  })

  it('returns NaN when a long is over-collateralized past zero', () => {
    expect(
      estimateLiquidationPriceFromMargin({
        entryPrice: 100,
        isLong: true,
        maxLeverage: 10,
        notionalUsd: 1000,
        marginUsd: 5000
      })
    ).toBeNaN()
  })

  it('returns NaN for invalid inputs', () => {
    expect(
      estimateLiquidationPriceFromMargin({
        entryPrice: 100,
        isLong: true,
        maxLeverage: 0,
        notionalUsd: 1000,
        marginUsd: 100
      })
    ).toBeNaN()
    expect(
      estimateLiquidationPriceFromMargin({
        entryPrice: 100,
        isLong: true,
        maxLeverage: 10,
        notionalUsd: 0,
        marginUsd: 100
      })
    ).toBeNaN()
    expect(
      estimateLiquidationPriceFromMargin({
        entryPrice: 100,
        isLong: true,
        maxLeverage: 10,
        notionalUsd: 1000,
        marginUsd: 0
      })
    ).toBeNaN()
  })
})

describe('maxRemovableMarginUsd', () => {
  it('is ~0 for a flat position at its set leverage', () => {
    // $1000 notional at 10×: margin = $100 = transfer floor → nothing removable.
    expect(
      maxRemovableMarginUsd({
        marginUsed: 100,
        unrealizedPnl: 0,
        notionalUsd: 1000,
        leverage: 10
      })
    ).toBe(0)
  })

  it('releases the margin above the transfer floor, with a 2% cushion', () => {
    // $200 margin against a $100 floor → (200 − 100) · 0.98 = 98.
    expect(
      maxRemovableMarginUsd({
        marginUsed: 200,
        unrealizedPnl: 0,
        notionalUsd: 1000,
        leverage: 10
      })
    ).toBeCloseTo(98)
  })

  it('counts unrealized PnL toward the removable equity', () => {
    // Equity = 100 + 50 = 150 vs a $100 floor → (150 − 100) · 0.98 = 49.
    expect(
      maxRemovableMarginUsd({
        marginUsed: 100,
        unrealizedPnl: 50,
        notionalUsd: 1000,
        leverage: 10
      })
    ).toBeCloseTo(49)
  })

  it('applies the 10% notional floor at high set leverage', () => {
    // 40×: notional/leverage = $25 but the floor is 0.1 · 1000 = $100.
    expect(
      maxRemovableMarginUsd({
        marginUsed: 200,
        unrealizedPnl: 0,
        notionalUsd: 1000,
        leverage: 40
      })
    ).toBeCloseTo(98)
  })

  it('never exceeds the deposited margin', () => {
    // Huge positive PnL can't unlock more than what was put in.
    expect(
      maxRemovableMarginUsd({
        marginUsed: 100,
        unrealizedPnl: 10_000,
        notionalUsd: 1000,
        leverage: 10
      })
    ).toBe(100)
  })

  it('clamps to 0 when underwater and for unknown leverage/notional', () => {
    expect(
      maxRemovableMarginUsd({
        marginUsed: 100,
        unrealizedPnl: -80,
        notionalUsd: 1000,
        leverage: 10
      })
    ).toBe(0)
    expect(
      maxRemovableMarginUsd({
        marginUsed: 100,
        unrealizedPnl: 0,
        notionalUsd: 0,
        leverage: 10
      })
    ).toBe(0)
    expect(
      maxRemovableMarginUsd({
        marginUsed: 100,
        unrealizedPnl: 0,
        notionalUsd: 1000,
        leverage: 0
      })
    ).toBe(0)
  })
})

describe('floorToDecimals', () => {
  it('floors instead of rounding so presets cannot exceed the cap', () => {
    expect(floorToDecimals(7.069, 2)).toBe(7.06)
    expect(floorToDecimals(7.061, 2)).toBe(7.06)
  })

  it('clamps negatives and non-finite values to 0', () => {
    expect(floorToDecimals(-1.23, 2)).toBe(0)
    expect(floorToDecimals(Number.NaN, 2)).toBe(0)
  })
})

describe('positionSizeTokens', () => {
  it('is position notional / entry', () => {
    expect(positionSizeTokens(100, 50)).toBe(2)
  })

  it('is 0 when entry is non-positive', () => {
    expect(positionSizeTokens(100, 0)).toBe(0)
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

describe('requiredTriggerSide', () => {
  it('take-profit is above for long, below for short', () => {
    expect(requiredTriggerSide('takeProfit', true)).toBe('above')
    expect(requiredTriggerSide('takeProfit', false)).toBe('below')
  })

  it('stop-loss is below for long, above for short', () => {
    expect(requiredTriggerSide('stopLoss', true)).toBe('below')
    expect(requiredTriggerSide('stopLoss', false)).toBe('above')
  })
})

describe('isTriggerValid', () => {
  // Reference price the trigger is validated against (the live mark in the app).
  const referencePrice = 100

  it('take-profit must be above the reference for a long, below for a short', () => {
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: true,
        price: 110,
        referencePrice
      })
    ).toBe(true)
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: true,
        price: 90,
        referencePrice
      })
    ).toBe(false)
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: false,
        price: 90,
        referencePrice
      })
    ).toBe(true)
  })

  it('stop-loss must be below the reference for a long, above for a short', () => {
    expect(
      isTriggerValid({
        kind: 'stopLoss',
        isLong: true,
        price: 90,
        referencePrice
      })
    ).toBe(true)
    expect(
      isTriggerValid({
        kind: 'stopLoss',
        isLong: true,
        price: 110,
        referencePrice
      })
    ).toBe(false)
    expect(
      isTriggerValid({
        kind: 'stopLoss',
        isLong: false,
        price: 110,
        referencePrice
      })
    ).toBe(true)
  })

  it('rejects a trigger exactly at the reference (strict side)', () => {
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: false,
        price: 100,
        referencePrice
      })
    ).toBe(false)
    expect(
      isTriggerValid({
        kind: 'stopLoss',
        isLong: true,
        price: 100,
        referencePrice
      })
    ).toBe(false)
  })

  it('rejects undefined / non-positive prices', () => {
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: true,
        price: undefined,
        referencePrice
      })
    ).toBe(false)
    expect(
      isTriggerValid({
        kind: 'takeProfit',
        isLong: true,
        price: 0,
        referencePrice
      })
    ).toBe(false)
  })
})
