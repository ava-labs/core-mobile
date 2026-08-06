/**
 * CP-14918 TEMP PROBE. NOT FOR MERGE.
 *
 * k2-alpine is a separate workspace package and cannot import core-mobile's
 * `app/utils/performance/perfProbe.ts`. This is a minimal local mirror of its
 * `perfCount`/`perfTime` (buffered, 2s flush) so hot render paths in this
 * folder (PriceChart, ChartHeader, ChartFooter, VolumeRow) don't spam logcat
 * with one line per frame. Emits the same `PERFPROBE <bucket>=<n>x/<ms>ms`
 * format as the core-mobile probe so both can be read the same way.
 */

import { formatActiveTime, formatLastUpdate } from './helpers'

type Bucket = { n: number; ms: number }

const buckets: Record<string, Bucket> = {}
let timer: ReturnType<typeof setInterval> | undefined

const now = (): number =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).performance?.now?.() ?? Date.now()

const flush = (): void => {
  const keys = Object.keys(buckets).filter(k => (buckets[k]?.n ?? 0) > 0)
  if (keys.length === 0) return

  const parts = keys.map(k => {
    const b = buckets[k] as Bucket
    return `${k}=${b.n}x/${b.ms.toFixed(1)}ms`
  })
  // eslint-disable-next-line no-console
  console.log(`PERFPROBE ${parts.join(' ')}`)

  keys.forEach(k => {
    buckets[k] = { n: 0, ms: 0 }
  })
}

export const perfCount = (name: string, ms: number): void => {
  const b = buckets[name] ?? { n: 0, ms: 0 }
  b.n += 1
  b.ms += ms
  buckets[name] = b

  if (!timer) {
    timer = setInterval(flush, 2000)
  }
}

/** Time a synchronous block and accumulate it under `name`. */
export const perfTime = <T>(name: string, fn: () => T): T => {
  const t0 = now()
  const result = fn()
  perfCount(name, now() - t0)
  return result
}

/** Current high-resolution timestamp, for callers timing their own spans. */
export const perfNow = (): number => now()

// ---------------------------------------------------------------------------
// CP-14918 TEMP PROBE: runtime Intl-vs-hand-rolled parity check.
//
// helpers.test.ts proves the hand-rolled formatters in helpers.ts match
// Node/V8's ICU byte-for-byte, but the runtime being replaced is Hermes on
// Android ICU, which has documented divergences in exactly this option
// space (facebook/hermes#1537 — hour-width zero-padding dropped when
// combining hour width with a 12-hour cycle; facebook/hermes#1822 — the
// device 24h toggle is ignored on iOS). `Intl` is still present on-device,
// so this re-checks parity for real against whatever ICU the app actually
// ships with, instead of trusting the Node-only test suite.
//
// The OLD `Intl.DateTimeFormat` option bags are reconstructed here (not
// re-imported — helpers.ts no longer constructs them) so this stays a
// faithful "what Intl produces today" reference independent of helpers.ts.
//
// CP-14918 (task Z fix-wave) midnight note: this is exactly the probe that
// caught the real bug — `runIntlParityProbe` on-device reported
// `mismatch=25`, every one of them the `activeTime` field at the midnight
// hour: on-device Hermes/Android ICU (`intlFormatActiveTime` below,
// unchanged) already produced "00:00" there, while the old hand-rolled
// `formatHour24Minute` produced "24:00" to match Node's ICU instead (see
// task-N2-report.md). `formatHour24Minute` was fixed to emit "00:00", which
// now agrees with what this reconstructed on-device `Intl` reference was
// already producing. No patch is needed HERE the way `helpers.test.ts` needs
// one for its Node-ICU reference: this file's reference runs on the real
// device runtime, so "hand-rolled now matches Intl at midnight" is the
// direct, unadjusted result of the fix — this comparison stays byte-faithful
// to on-device `Intl` with no special-casing.
//
// CP-14918 (device-confirm fix-wave, task-Z2-device-confirm.md) AM/PM
// separator note: the SAME probe then caught a second, distinct bug after
// the midnight fix — an on-device run reported `ok=20 mismatch=20`, every
// one of them the `lastUpdate` field: on-device Hermes/Android ICU
// (`intlFormatLastUpdate` below, unchanged) emits U+202F (NARROW NO-BREAK
// SPACE) between the minutes and AM/PM (the ICU 72+ CLDR separator change),
// while the old hand-rolled `formatHour12Minute` emitted a plain ASCII
// space. `formatHour12Minute` was fixed to emit U+202F, which now agrees
// with what this reconstructed on-device `Intl` reference was already
// producing — same story as the midnight fix: no patch needed HERE, this
// file's reference already runs on the real device runtime. With both
// fixes landed, a device run of `runIntlParityProbe` is expected to report
// `mismatch=0`.
// ---------------------------------------------------------------------------

const intlFormatActiveTime = (ts: number, nowMs: number): string => {
  const d = new Date(ts)
  const nowDate = new Date(nowMs)
  const sameDay =
    d.getFullYear() === nowDate.getFullYear() &&
    d.getMonth() === nowDate.getMonth() &&
    d.getDate() === nowDate.getDate()
  const datePart = sameDay
    ? 'Today'
    : new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric'
      }).format(d)
  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  }).format(d)
  return `${datePart}, ${timePart}`
}

const intlFormatLastUpdate = (ts: number): string => {
  const d = new Date(ts)
  const datePart = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d)
  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(d)
  return `Last update: ${datePart} at ${timePart}`
}

type IntlParityCase = { label: string; ts: number; nowMs: number }

/** ~20 representative timestamps: midnight/noon, single- vs double-digit
 * day/hour, year boundaries, leap day, the epoch, and "now" — built from
 * local date components so they exercise whatever local ICU the device is
 * running, not a fixed UTC instant. */
const intlParityCases = (): IntlParityCase[] => {
  const nowMs = Date.now()
  const nowDate = new Date(nowMs)
  const y = nowDate.getFullYear()
  const m = nowDate.getMonth()
  const day = nowDate.getDate()
  return [
    { label: 'now', ts: nowMs, nowMs },
    {
      label: 'today-midnight',
      ts: new Date(y, m, day, 0, 0, 0).getTime(),
      nowMs
    },
    { label: 'today-noon', ts: new Date(y, m, day, 12, 0, 0).getTime(), nowMs },
    {
      label: 'single-digit-day-hour',
      ts: new Date(y, 3, 5, 1, 5, 0).getTime(),
      nowMs
    },
    {
      label: 'double-digit-day-hour',
      ts: new Date(y, 3, 25, 23, 45, 0).getTime(),
      nowMs
    },
    {
      label: 'year-boundary-eve',
      ts: new Date(y - 1, 11, 31, 23, 59, 0).getTime(),
      nowMs
    },
    {
      label: 'year-boundary-day',
      ts: new Date(y, 0, 1, 0, 1, 0).getTime(),
      nowMs
    },
    {
      label: 'single-digit-minute',
      ts: new Date(y, 5, 9, 9, 5, 0).getTime(),
      nowMs
    },
    {
      label: 'evening-double-digit',
      ts: new Date(y, 5, 19, 19, 41, 0).getTime(),
      nowMs
    },
    { label: 'epoch', ts: 0, nowMs },
    {
      label: 'leap-day',
      ts: new Date(2028, 1, 29, 13, 13, 0).getTime(),
      nowMs
    },
    {
      label: 'one-minute-before-midnight',
      ts: new Date(y, 6, 4, 23, 59, 0).getTime(),
      nowMs
    },
    {
      label: 'one-minute-after-midnight',
      ts: new Date(y, 6, 5, 0, 1, 0).getTime(),
      nowMs
    },
    { label: 'noon-exact', ts: new Date(y, 7, 15, 12, 0, 0).getTime(), nowMs },
    {
      label: 'midnight-exact',
      ts: new Date(y, 7, 16, 0, 0, 0).getTime(),
      nowMs
    },
    { label: '1am', ts: new Date(y, 8, 3, 1, 0, 0).getTime(), nowMs },
    { label: '11pm', ts: new Date(y, 8, 3, 23, 0, 0).getTime(), nowMs },
    {
      label: 'past-year',
      ts: new Date(y - 3, 5, 15, 10, 30, 0).getTime(),
      nowMs
    },
    {
      label: 'future-year',
      ts: new Date(y + 2, 5, 15, 10, 30, 0).getTime(),
      nowMs
    },
    {
      label: 'far-past-day-boundary',
      ts: new Date(y - 1, 0, 1, 0, 30, 0).getTime(),
      nowMs: new Date(y - 1, 0, 2, 0, 30, 0).getTime()
    }
  ]
}

export type IntlParityResult = {
  ok: number
  mismatch: number
  details: string[]
}

/** Pure comparison — no console I/O — so it's unit-testable. On the
 * runtime the Node/Jest test suite actually runs (V8/Node ICU), this is
 * expected to report `mismatch: 0`, which only proves the reconstructed-Intl
 * vs hand-rolled comparison harness itself is wired correctly. It does NOT
 * prove Hermes/Android ICU parity — only `runIntlParityProbe` running on an
 * actual device does that. */
export const computeIntlParity = (): IntlParityResult => {
  let ok = 0
  let mismatch = 0
  const details: string[] = []

  for (const { label, ts, nowMs } of intlParityCases()) {
    try {
      const intl = intlFormatActiveTime(ts, nowMs)
      const handRolled = formatActiveTime(ts, nowMs)
      if (intl === handRolled) {
        ok += 1
      } else {
        mismatch += 1
        details.push(
          `PERFPROBE intlParityDetail case=${label} field=activeTime ts=${ts} intl="${intl}" handRolled="${handRolled}"`
        )
      }
    } catch (e) {
      mismatch += 1
      details.push(
        `PERFPROBE intlParityDetail case=${label} field=activeTime ts=${ts} threw="${String(
          e
        )}"`
      )
    }

    try {
      const intl = intlFormatLastUpdate(ts)
      const handRolled = formatLastUpdate(ts)
      if (intl === handRolled) {
        ok += 1
      } else {
        mismatch += 1
        details.push(
          `PERFPROBE intlParityDetail case=${label} field=lastUpdate ts=${ts} intl="${intl}" handRolled="${handRolled}"`
        )
      }
    } catch (e) {
      mismatch += 1
      details.push(
        `PERFPROBE intlParityDetail case=${label} field=lastUpdate ts=${ts} threw="${String(
          e
        )}"`
      )
    }
  }

  return { ok, mismatch, details }
}

let intlParityRan = false

/**
 * Runs `computeIntlParity` once per app session (module-level flag — cheap
 * insurance against ChartHeader mounting more than once, e.g. multiple
 * charts on screen) and logs the result. `__DEV__`-gated so it is a no-op
 * in release builds. Call site: ChartHeader's mount effect.
 */
export const runIntlParityProbe = (): void => {
  if (intlParityRan) return
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return
  intlParityRan = true

  const { ok, mismatch, details } = computeIntlParity()
  // eslint-disable-next-line no-console
  console.log(`PERFPROBE intlParity ok=${ok} mismatch=${mismatch}`)
  details.forEach(line => {
    // eslint-disable-next-line no-console
    console.log(line)
  })
}
