import { parseStakeEndTimeParam } from './parseStakeEndTimeParam'

describe('parseStakeEndTimeParam', () => {
  it('returns a UTCDate for a positive Unix-seconds string', () => {
    const result = parseStakeEndTimeParam('1700000000')
    expect(result).toBeDefined()
    // Verify against the equivalent millis (Unix-seconds × 1000) so the
    // assertion stays stable regardless of the host's locale / TZ.
    expect(result?.getTime()).toBe(1_700_000_000 * 1000)
  })

  it('accepts a numeric-like string with a decimal point', () => {
    // The PVM exposes integer seconds, but the route param is a string and
    // could in principle carry a fractional second through. Math still
    // works — we just floor it back to ms when constructing the date.
    const result = parseStakeEndTimeParam('1700000000.5')
    expect(result).toBeDefined()
    expect(result?.getTime()).toBe(Math.round(1_700_000_000.5 * 1000))
  })

  it.each<[string, unknown]>([
    ['undefined', undefined],
    ['empty string', ''],
    ['NaN string', 'not a number'],
    ['+Infinity', 'Infinity'],
    ['-Infinity', '-Infinity'],
    ['zero (epoch)', '0'],
    ['negative', '-1700000000']
  ])('returns undefined for %s', (_label, input) => {
    expect(parseStakeEndTimeParam(input as string | undefined)).toBeUndefined()
  })
})
