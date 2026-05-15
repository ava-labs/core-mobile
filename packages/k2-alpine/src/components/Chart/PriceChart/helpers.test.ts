import {
  priceToY,
  indexToX,
  touchXToIndex,
  rangeBounds,
  yAxisTicks
} from './helpers'
import { OhlcCandle } from './types'

const sampleCandles: OhlcCandle[] = [
  { ts: 0, open: 10, high: 12, low: 9, close: 11, volume: 100 },
  { ts: 1000, open: 11, high: 14, low: 10, close: 13, volume: 200 },
  { ts: 2000, open: 13, high: 13, low: 11, close: 12, volume: 150 }
]

describe('priceToY', () => {
  it('maps the highest price to the top (small y)', () => {
    expect(
      priceToY({ price: 14, priceMin: 9, priceMax: 14, height: 100 })
    ).toBe(0)
  })

  it('maps the lowest price to the bottom (large y)', () => {
    expect(priceToY({ price: 9, priceMin: 9, priceMax: 14, height: 100 })).toBe(
      100
    )
  })

  it('maps the midpoint to the middle', () => {
    expect(
      priceToY({ price: 11.5, priceMin: 9, priceMax: 14, height: 100 })
    ).toBe(50)
  })

  it('returns NaN-safe value when range is zero (flat data)', () => {
    expect(
      priceToY({ price: 10, priceMin: 10, priceMax: 10, height: 100 })
    ).toBe(50)
  })
})

describe('indexToX', () => {
  it('maps index 0 to x=0', () => {
    expect(indexToX(0, 3, 300)).toBe(0)
  })

  it('maps last index to width', () => {
    expect(indexToX(2, 3, 300)).toBe(300)
  })

  it('handles single-candle input without divide-by-zero', () => {
    expect(indexToX(0, 1, 300)).toBe(150)
  })
})

describe('touchXToIndex', () => {
  it('returns 0 for x=0', () => {
    expect(touchXToIndex(0, 3, 300)).toBe(0)
  })

  it('returns last index for x=width', () => {
    expect(touchXToIndex(300, 3, 300)).toBe(2)
  })

  it('clamps negative x to 0', () => {
    expect(touchXToIndex(-50, 3, 300)).toBe(0)
  })

  it('clamps x > width to last index', () => {
    expect(touchXToIndex(500, 3, 300)).toBe(2)
  })

  it('rounds to nearest', () => {
    expect(touchXToIndex(50, 3, 300)).toBe(0)
    expect(touchXToIndex(100, 3, 300)).toBe(1)
    expect(touchXToIndex(149, 3, 300)).toBe(1)
    expect(touchXToIndex(151, 3, 300)).toBe(1)
  })

  it('handles empty input safely', () => {
    expect(touchXToIndex(100, 0, 300)).toBe(0)
  })
})

describe('rangeBounds', () => {
  it('returns the min low and max high across all candles', () => {
    expect(rangeBounds(sampleCandles)).toEqual({ minPrice: 9, maxPrice: 14 })
  })

  it('handles empty input as { minPrice: 0, maxPrice: 0 }', () => {
    expect(rangeBounds([])).toEqual({ minPrice: 0, maxPrice: 0 })
  })

  it('handles a single candle', () => {
    const singleCandle = sampleCandles.slice(0, 1)
    expect(rangeBounds(singleCandle)).toEqual({ minPrice: 9, maxPrice: 12 })
  })
})

describe('yAxisTicks', () => {
  it('returns count+1 evenly-spaced ticks from min to max', () => {
    expect(yAxisTicks(0, 30, 3)).toEqual([0, 10, 20, 30])
  })

  it('handles non-integer ranges', () => {
    expect(yAxisTicks(10, 11, 3)).toEqual([
      10, 10.333333333333334, 10.666666666666666, 11
    ])
  })

  it('returns a single tick when min === max', () => {
    expect(yAxisTicks(5, 5, 3)).toEqual([5])
  })
})
