import {
  priceToY,
  indexToX,
  touchXToIndex,
  rangeBounds,
  yAxisTicks,
  traceSmoothLine,
  formatActiveTime,
  formatLastUpdate,
  formatVolume
} from './helpers'

// `traceSmoothLine` only invokes `path.moveTo(x, y)` and
// `path.cubicTo(...)` — we can fake the SkPath without importing Skia
// (which requires native bridge transforms Jest doesn't ship by default).
const makeRecordingPath = (): {
  moveTo: jest.Mock
  cubicTo: jest.Mock
} => ({
  moveTo: jest.fn(),
  cubicTo: jest.fn()
})
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

describe('traceSmoothLine', () => {
  it('is a no-op on empty input', () => {
    const p = makeRecordingPath()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    traceSmoothLine(p as any, [])
    expect(p.moveTo).not.toHaveBeenCalled()
    expect(p.cubicTo).not.toHaveBeenCalled()
  })

  it('moves to the only point when given a single point', () => {
    const p = makeRecordingPath()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    traceSmoothLine(p as any, [{ x: 10, y: 20 }])
    expect(p.moveTo).toHaveBeenCalledWith(10, 20)
    expect(p.cubicTo).not.toHaveBeenCalled()
  })

  it('emits one cubic-to per segment between adjacent points', () => {
    const p = makeRecordingPath()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    traceSmoothLine(p as any, [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
      { x: 30, y: 5 }
    ])
    // 4 points → 3 segments → 3 cubicTo calls.
    expect(p.cubicTo).toHaveBeenCalledTimes(3)
    expect(p.moveTo).toHaveBeenCalledTimes(1)
  })
})

describe('formatVolume', () => {
  it('formats sub-thousand volumes with two decimals', () => {
    expect(formatVolume(0)).toBe('Vol. $0.00')
    expect(formatVolume(999.5)).toBe('Vol. $999.50')
  })
  it('formats thousands with K suffix', () => {
    expect(formatVolume(1_500)).toBe('Vol. $1.50K')
  })
  it('formats millions with M suffix', () => {
    expect(formatVolume(1_500_000)).toBe('Vol. $1.50M')
  })
  it('formats billions with B suffix', () => {
    expect(formatVolume(2_300_000_000)).toBe('Vol. $2.30B')
  })
})

describe('formatActiveTime', () => {
  // `formatActiveTime` uses local-time getters (getFullYear/Month/Date), so
  // constructing the test timestamps from local components keeps the "Today"
  // assertion stable regardless of the CI timezone.
  const sameDayTs = new Date(2026, 4, 15, 7, 25, 0).getTime()
  const now = new Date(2026, 4, 15, 12, 0, 0).getTime()
  const earlierDayTs = new Date(2026, 3, 29, 7, 25, 0).getTime()

  it('uses "Today" prefix when the timestamp is on the same day as now', () => {
    expect(formatActiveTime(sameDayTs, now)).toContain('Today,')
  })

  it('uses a Mmm DD date when the timestamp is on a different day', () => {
    const out = formatActiveTime(earlierDayTs, now)
    expect(out).not.toContain('Today,')
    // The exact month abbreviation depends on locale, but it should not
    // include the year (formatActiveTime keeps it short).
    expect(out).not.toMatch(/2026/)
  })

  it('formats time in 24-hour numeric (no AM/PM)', () => {
    expect(formatActiveTime(sameDayTs, now)).not.toMatch(/AM|PM/)
  })
})

describe('formatLastUpdate', () => {
  it('prefixes with "Last update:"', () => {
    const ts = new Date('2026-04-29T13:41:00Z').getTime()
    expect(formatLastUpdate(ts)).toMatch(/^Last update:/)
  })

  it('uses the full Wed, Apr 29, 2026 at H:mm format', () => {
    const ts = new Date('2026-04-29T13:41:00Z').getTime()
    const out = formatLastUpdate(ts)
    // Year is included; "at" joins date and time.
    expect(out).toMatch(/2026/)
    expect(out).toContain(' at ')
  })
})
