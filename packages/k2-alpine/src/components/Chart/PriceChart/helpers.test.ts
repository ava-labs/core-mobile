import {
  priceToY,
  indexToX,
  touchXToIndex,
  rangeBounds,
  yAxisTicks,
  traceSmoothLine,
  formatActiveTime,
  formatCandleDisplayStringAt,
  formatCandleDisplayStrings,
  formatLastUpdate,
  formatVolume,
  isFullFormatNeeded
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
  it('formats sub-1 volumes with two decimals', () => {
    expect(formatVolume(0.5)).toBe('Vol. $0.50')
  })
  it('formats very large (multi-trillion, expressed as B) volumes', () => {
    expect(formatVolume(4_200_000_000_000)).toBe('Vol. $4200.00B')
  })
})

// CP-14918: ChartHeader/ChartFooter used to eagerly format ALL candles at
// mount (for crosshair drag lookups) even though the crosshair-inactive
// state only ever reads the LAST candle. `formatCandleDisplayStringAt` is
// the O(1) mount-time replacement; it must never disagree with the
// corresponding entry of the O(n) `formatCandleDisplayStrings` array that
// the deferred/crosshair-active path uses, for every index the crosshair
// can land on — a `formatPrice` sensitive to more than the raw close would
// expose a regression here.
describe('formatCandleDisplayStringAt — parity with formatCandleDisplayStrings', () => {
  const formatPrice = (n: number): string => `$${n.toFixed(2)}`

  it('matches the corresponding full-array entry for every index', () => {
    const full = formatCandleDisplayStrings(sampleCandles, formatPrice)
    sampleCandles.forEach((_, i) => {
      expect(
        formatCandleDisplayStringAt(sampleCandles, i, formatPrice)
      ).toEqual(full[i])
    })
  })

  it('matches the last-candle entry (the eager mount-time read path)', () => {
    const full = formatCandleDisplayStrings(sampleCandles, formatPrice)
    const lastIndex = sampleCandles.length - 1
    expect(
      formatCandleDisplayStringAt(sampleCandles, lastIndex, formatPrice)
    ).toEqual(full[lastIndex])
  })

  it('returns undefined for an out-of-range index', () => {
    expect(
      formatCandleDisplayStringAt(sampleCandles, 99, formatPrice)
    ).toBeUndefined()
    expect(
      formatCandleDisplayStringAt(sampleCandles, -1, formatPrice)
    ).toBeUndefined()
  })

  it('returns undefined for empty candles, matching the full-array path', () => {
    expect(formatCandleDisplayStringAt([], 0, formatPrice)).toBeUndefined()
    expect(formatCandleDisplayStrings([], formatPrice)).toEqual([])
  })
})

// CP-14918: `isFullFormatNeeded` is the pure gate behind `useIsFullFormatNeeded`
// (hooks.ts), which decides when ChartHeader/ChartFooter compute the full
// per-candle array instead of just the eagerly-formatted last candle. The
// contract that matters most: the instant the crosshair activates (`idx`
// goes non-null), the gate must flip to `true` regardless of whether the
// post-mount idle tick has fired yet — so the consuming `useMemo` recomputes
// SYNCHRONOUSLY in that same render and a drag can never read a `undefined`
// entry for any in-range index.
describe('isFullFormatNeeded', () => {
  it('is false at mount before the idle tick fires and before any drag', () => {
    expect(isFullFormatNeeded(false, null)).toBe(false)
  })

  it('becomes true once the idle tick fires, even with no active drag', () => {
    expect(isFullFormatNeeded(true, null)).toBe(true)
  })

  it('becomes true the instant the crosshair activates, even pre-idle-tick', () => {
    expect(isFullFormatNeeded(false, 0)).toBe(true)
    expect(isFullFormatNeeded(false, 47)).toBe(true)
  })

  it('stays true once both conditions are true', () => {
    expect(isFullFormatNeeded(true, 12)).toBe(true)
  })

  it('once true (crosshair active), the full array has a defined entry for every in-range index the crosshair can land on', () => {
    const formatPrice = (n: number): string => `$${n.toFixed(2)}`
    sampleCandles.forEach((_, idx) => {
      // Mirrors ChartHeader/ChartFooter: `needsFull` gates whether the full
      // array is computed at all; once gated open by activation, every
      // valid index must resolve to a real entry, never `undefined`.
      const needsFull = isFullFormatNeeded(false, idx)
      expect(needsFull).toBe(true)
      const full = formatCandleDisplayStrings(sampleCandles, formatPrice)
      expect(full[idx]).toBeDefined()
    })
  })
})

// CP-14918: formatActiveTime/formatLastUpdate were changed from
// `Intl.DateTimeFormat`-based formatting (first a fresh instance per call,
// later a module-hoisted instance) to hand-rolled string formatting — the
// `.format()` CALL itself, not the constructor, is what costs ~4ms on-device
// (Hermes -> JSI -> Android ICU). `toLocaleDateString`/`toLocaleTimeString`
// are specified (ECMA-402) to build an `Intl.DateTimeFormat(locale,
// options)` internally and format with it, so these remain a live,
// jest-cheap ground truth the hand-rolled implementation must match
// byte-for-byte, run on Node's ICU (en-US) rather than device ICU.
const intlFormatActiveTime = (ts: number, nowMs?: number): string => {
  const d = new Date(ts)
  const now = nowMs !== undefined ? new Date(nowMs) : new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const datePart = sameDay
    ? 'Today'
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const timePart = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  })
  return `${datePart}, ${timePart}`
}

const intlFormatLastUpdate = (ts: number): string => {
  const d = new Date(ts)
  const datePart = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const timePart = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
  return `Last update: ${datePart} at ${timePart}`
}

// CP-14918 (task Z fix-wave): Node/V8's ICU renders en-US `hour12: false` as
// the h24 hour cycle (hours 1-24), so `intlFormatActiveTime` above legitimately
// prints "24:MM" at midnight — that was verified against real Node `Intl`
// output when this test file was written. But an on-device parity probe
// (`runIntlParityProbe`, task-N2-report.md: `PERFPROBE intlParity ok=15
// mismatch=25`, captured 2026-08-05) proved every single mismatch between
// Hermes/Android ICU and the (then-)hand-rolled formatter was exactly this
// case, and that Hermes/Android ICU actually renders midnight as "00:00"
// (h23), not "24:00". The device is the correct reference, not Node's ICU,
// so `formatHour24Minute` (helpers.ts) was changed to emit "00:00" — which
// now legitimately diverges from `intlFormatActiveTime`'s Node-ICU output at
// exactly the hour-0 boundary. This wrapper patches that one known,
// documented divergence onto the Node-ICU reference before comparing, so the
// parity tests keep asserting real equivalence everywhere else while pinning
// the corrected "00:MM" literal at midnight instead of chasing the wrong
// (Node-only) reference.
const expectedActiveTime = (ts: number, nowMs?: number): string => {
  const reference = intlFormatActiveTime(ts, nowMs)
  const isMidnightHour = new Date(ts).getHours() === 0
  return isMidnightHour ? reference.replace(/24:(\d{2})$/, '00:$1') : reference
}

// CP-14918 (device-confirm fix-wave, task-Z2-device-confirm.md): an on-device
// run of `runIntlParityProbe` reported `ok=20 mismatch=20` — EVERY 12-hour
// comparison failing, always at the byte between minutes and AM/PM. Hexdump
// evidence: Hermes/Android ICU emits U+202F (NARROW NO-BREAK SPACE, UTF-8
// `e2 80 af`) there — the ICU 72+ CLDR "hour-minute" pattern separator
// change — not the ASCII space (`0x20`) `intlFormatLastUpdate` below
// produces on Node's (older) bundled ICU in this Jest environment (verified
// directly: `Intl.DateTimeFormat` on Node here -> "9:05 AM", 0x20). The
// device is the correct reference — that is what users actually saw
// pre-migration — so `formatHour12Minute` (helpers.ts) now emits U+202F,
// which legitimately diverges from the Node-ICU reference at that one byte.
// Same treatment as `expectedActiveTime` above: patch this one known,
// documented divergence onto the Node-ICU reference before comparing, so
// these tests keep asserting real equivalence everywhere else.
const expectedLastUpdate = (ts: number): string =>
  intlFormatLastUpdate(ts).replace(/ (AM|PM)$/, '\u202f$1')

describe('formatActiveTime / formatLastUpdate — hand-rolled vs Intl parity', () => {
  const cases: Array<[string, number, number | undefined]> = [
    [
      'same-day midnight',
      new Date(2026, 4, 15, 0, 0, 0).getTime(),
      new Date(2026, 4, 15, 12, 0, 0).getTime()
    ],
    [
      'different-day midnight',
      new Date(2026, 4, 14, 0, 0, 0).getTime(),
      new Date(2026, 4, 15, 12, 0, 0).getTime()
    ],
    [
      'year boundary (Dec 31 -> Jan 1)',
      new Date(2025, 11, 31, 23, 59, 0).getTime(),
      new Date(2026, 0, 1, 0, 30, 0).getTime()
    ],
    ['no explicit `now` (uses real Date.now())', Date.now(), undefined]
  ]

  it.each(cases)(
    'formatActiveTime matches the live Intl implementation: %s',
    (_label, ts, nowMs) => {
      expect(formatActiveTime(ts, nowMs)).toBe(expectedActiveTime(ts, nowMs))
    }
  )

  it.each(cases)(
    'formatLastUpdate matches the live Intl implementation: %s',
    (_label, ts) => {
      expect(formatLastUpdate(ts)).toBe(expectedLastUpdate(ts))
    }
  )
})

// CP-14918: broad sweep of the hand-rolled formatters against live
// `Intl`/`toLocale*` output (cheap here — Jest runs on Node, not the
// Hermes->JSI->Android-ICU path this task removed from the hot path).
// Covers year boundaries, leap-day, midnight/noon, single- vs double-digit
// day/hour, the 1970 epoch, an invalid (NaN) timestamp, and — in a nested
// describe that pins `process.env.TZ` — DST spring-forward/fall-back edges.
describe('formatActiveTime / formatLastUpdate — Intl parity sweep', () => {
  const originalTz = process.env.TZ

  afterAll(() => {
    process.env.TZ = originalTz
  })

  // Built from LOCAL date components (matching formatActiveTime's/
  // formatLastUpdate's own local-time `Date` getters), so equality holds
  // under whatever TZ the test runner happens to use.
  const sweepTimestamps = (): number[] => {
    const days: Array<[number, number, number]> = [
      [2026, 0, 1], // New Year's Day
      [2025, 11, 31], // New Year's Eve (year boundary, other side)
      [2026, 1, 28], // non-leap Feb
      [2028, 1, 29], // leap-day
      [2026, 3, 5], // single-digit day
      [2026, 3, 15], // double-digit day
      [1970, 0, 1] // epoch date
    ]
    const hours = [0, 1, 9, 10, 12, 13, 23] // midnight, single/double-digit, noon
    const minutes = [0, 5, 30, 59]
    const timestamps: number[] = []
    for (const [y, m, day] of days) {
      for (const hour of hours) {
        for (const minute of minutes) {
          timestamps.push(new Date(y, m, day, hour, minute, 0).getTime())
        }
      }
    }
    return timestamps
  }

  it('formatActiveTime matches live Intl output across the sweep', () => {
    const now = new Date(2026, 3, 15, 12, 0, 0).getTime()
    for (const ts of sweepTimestamps()) {
      expect(formatActiveTime(ts, now)).toBe(expectedActiveTime(ts, now))
    }
  })

  it('formatLastUpdate matches live Intl output across the sweep', () => {
    for (const ts of sweepTimestamps()) {
      expect(formatLastUpdate(ts)).toBe(expectedLastUpdate(ts))
    }
  })

  it('handles the 1970-01-01 epoch without throwing, matching Intl', () => {
    const ts = new Date(1970, 0, 1, 0, 0, 0).getTime()
    expect(formatActiveTime(ts, ts)).toBe(expectedActiveTime(ts, ts))
    expect(formatLastUpdate(ts)).toBe(expectedLastUpdate(ts))
  })

  it('pins the AM/PM separator to U+202F (NNBSP), not an ASCII space — device-confirmed divergence from Node ICU (task-Z2-device-confirm.md)', () => {
    // This asserts the exact byte directly, NOT via `expectedLastUpdate`'s
    // Node-ICU reference (which would just prove the normalization regex
    // works, not that the hand-rolled formatter emits the right codepoint).
    // Hermes/Android ICU emits U+202F between the minutes and AM/PM;
    // Node's bundled ICU here still emits a plain ASCII space (0x20) for
    // the same option bag — that's the whole reason this needed pinning
    // rather than relying on Node-Intl parity. If a future change reverts
    // `formatHour12Minute` to an ASCII space, this must fail loudly.
    const nineOhFiveAm = new Date(2026, 3, 29, 9, 5, 0).getTime()
    const noonNoon = new Date(2026, 3, 29, 12, 0, 0).getTime()

    expect(formatLastUpdate(nineOhFiveAm)).toContain('9:05\u202fAM')
    expect(formatLastUpdate(nineOhFiveAm)).not.toContain('9:05 AM') // ASCII-space regression guard
    expect(formatLastUpdate(noonNoon)).toContain('12:00\u202fPM')
    expect(formatLastUpdate(noonNoon)).not.toContain('12:00 PM') // ASCII-space regression guard
  })

  it('throws the same RangeError as raw Intl.DateTimeFormat#format for an invalid (NaN) timestamp', () => {
    // NOTE: `Date.prototype.toLocaleDateString`/`toLocaleTimeString` special-case
    // an invalid time value and return the string "Invalid Date" instead of
    // throwing (ECMA-402 has an explicit NaN short-circuit before delegating
    // to the internal formatter) — so `intlFormatActiveTime`/`intlFormatLastUpdate`
    // above are NOT the right reference here. The actual pre-CP-14918
    // production code called `Intl.DateTimeFormat(...).format(d)` directly
    // (no such short-circuit), which DOES throw — that's the real contract
    // the hand-rolled formatters must preserve.
    const rawFormatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric'
    })
    expect(() => formatActiveTime(NaN)).toThrow(RangeError)
    expect(() => rawFormatter.format(new Date(NaN))).toThrow(RangeError)
    expect(() => formatLastUpdate(NaN)).toThrow(RangeError)
  })

  describe('DST transitions (America/New_York)', () => {
    beforeAll(() => {
      process.env.TZ = 'America/New_York'
    })

    afterAll(() => {
      process.env.TZ = originalTz
    })

    it('matches live Intl output across the 2026 spring-forward/fall-back edges', () => {
      const dstTimestamps = [
        new Date(2026, 2, 8, 1, 59, 0).getTime(), // just before spring-forward
        new Date(2026, 2, 8, 3, 1, 0).getTime(), // just after (2-3am doesn't exist)
        new Date(2026, 10, 1, 0, 30, 0).getTime(), // just before fall-back
        new Date(2026, 10, 1, 1, 30, 0).getTime() // ambiguous hour (occurs twice)
      ]
      const now = new Date(2026, 2, 8, 12, 0, 0).getTime()
      for (const ts of dstTimestamps) {
        expect(formatActiveTime(ts, now)).toBe(expectedActiveTime(ts, now))
        expect(formatLastUpdate(ts)).toBe(expectedLastUpdate(ts))
      }
    })
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
