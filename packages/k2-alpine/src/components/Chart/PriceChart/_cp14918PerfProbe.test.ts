import { computeIntlParity } from './_cp14918PerfProbe'

// CP-14918 TEMP PROBE TEST. NOT FOR MERGE.
//
// This is a smoke test for the comparison harness itself, run on Node/V8
// ICU — it is NOT a substitute for the on-device Hermes/Android ICU check
// `runIntlParityProbe` performs. A clean `mismatch: 0` here only proves the
// reconstructed-Intl-vs-hand-rolled wiring is correct; the whole point of
// the runtime probe is that Node/V8 parity was never in question (see
// helpers.test.ts) — Hermes/Android ICU is.
//
// CP-14918 (task Z fix-wave) midnight update: an on-device run of THIS
// probe (`runIntlParityProbe`, task-N2-report.md: `PERFPROBE intlParity
// ok=15 mismatch=25`, 2026-08-05) found real Hermes/Android ICU already
// renders midnight as "00:MM" — the opposite of Node/V8's ICU, which
// renders it "24:MM" (h24 hour cycle) for the same `hour12: false` option
// bag. `formatActiveTime`'s hand-rolled midnight branch (helpers.ts) was
// fixed to match the DEVICE ("00:MM"), which is correct on-device but now
// disagrees with this test suite's Node-ICU `intlFormatActiveTime`
// reference at exactly that one boundary.
//
// CP-14918 (device-confirm fix-wave, task-Z2-device-confirm.md) AM/PM
// separator update: a SECOND on-device run of this same probe (after the
// midnight fix landed) reported `ok=20 mismatch=20` — every `lastUpdate`
// comparison failing at the byte between minutes and AM/PM. Hermes/Android
// ICU emits U+202F (NARROW NO-BREAK SPACE) there (ICU 72+ CLDR separator
// change); Node's bundled ICU here still emits a plain ASCII space for the
// same option bag. `formatHour12Minute` (helpers.ts) was fixed to match
// the DEVICE (U+202F), which now disagrees with this suite's Node-ICU
// `intlFormatLastUpdate` reference at exactly that one byte.
//
// So a clean `mismatch: 0` is not the right assertion on Node for either
// field — assert instead that every mismatch this harness reports is
// EXACTLY one of these two known, documented Node-vs-device divergences
// (midnight `activeTime`, or the AM/PM separator on `lastUpdate`), and
// nothing else, so a real regression elsewhere still fails this test.
describe('computeIntlParity (CP-14918 runtime probe harness)', () => {
  it('reports mismatches only at the known Node-ICU-vs-device divergences (midnight, AM/PM separator)', () => {
    const result = computeIntlParity()

    result.details.forEach(detail => {
      const isMidnightActiveTime =
        detail.includes('field=activeTime') &&
        /intl="[^"]*24:\d{2}"/.test(detail) &&
        /handRolled="[^"]*00:\d{2}"/.test(detail)
      const isAmPmSeparatorLastUpdate =
        detail.includes('field=lastUpdate') &&
        /intl="[^"]* (AM|PM)"/.test(detail) &&
        /handRolled="[^"]*\u202f(AM|PM)"/.test(detail)
      expect(isMidnightActiveTime || isAmPmSeparatorLastUpdate).toBe(true)
    })
    expect(result.mismatch).toBe(result.details.length)
    expect(result.ok).toBeGreaterThan(0)
  })
})
