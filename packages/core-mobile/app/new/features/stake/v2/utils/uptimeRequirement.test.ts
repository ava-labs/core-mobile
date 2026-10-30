import {
  MIN_UPTIME_FOR_REWARDS,
  getUptimeColor,
  isUptimeBelowRequirement,
  parseUptime
} from './uptimeRequirement'

describe('MIN_UPTIME_FOR_REWARDS', () => {
  it('is a flat 90 (percent scale)', () => {
    expect(MIN_UPTIME_FOR_REWARDS).toBe(90)
  })
})

describe('parseUptime', () => {
  it('parses numbers and numeric strings on the 0-100 scale', () => {
    expect(parseUptime(99.91)).toBe(99.91)
    expect(parseUptime('60.11')).toBe(60.11)
    expect(parseUptime('0')).toBe(0)
    expect(parseUptime('90.00')).toBe(90)
    expect(parseUptime(' 89.999 ')).toBe(89.999)
    expect(parseUptime(-1)).toBe(-1)
  })

  it('returns undefined for missing, blank, or non-numeric input', () => {
    expect(parseUptime(undefined)).toBeUndefined()
    expect(parseUptime('')).toBeUndefined()
    expect(parseUptime('   ')).toBeUndefined()
    expect(parseUptime('abc')).toBeUndefined()
    expect(parseUptime(NaN)).toBeUndefined()
    expect(parseUptime(Infinity)).toBeUndefined()
    expect(parseUptime('90%')).toBeUndefined()
    expect(parseUptime(null as unknown as undefined)).toBeUndefined()
    expect(parseUptime(false as unknown as undefined)).toBeUndefined()
    expect(parseUptime([] as unknown as undefined)).toBeUndefined()
  })
})

describe('isUptimeBelowRequirement', () => {
  it('is true strictly below the threshold', () => {
    expect(isUptimeBelowRequirement(89.99)).toBe(true)
    expect(isUptimeBelowRequirement('89.99')).toBe(true)
    expect(isUptimeBelowRequirement('0')).toBe(true)
    expect(isUptimeBelowRequirement(0)).toBe(true)
    expect(isUptimeBelowRequirement(-1)).toBe(true)
    expect(isUptimeBelowRequirement(' 89.999 ')).toBe(true)
  })

  it('is false at or above the threshold', () => {
    expect(isUptimeBelowRequirement(90)).toBe(false)
    expect(isUptimeBelowRequirement('90')).toBe(false)
    expect(isUptimeBelowRequirement(100)).toBe(false)
    expect(isUptimeBelowRequirement('90.00')).toBe(false)
  })

  it('never warns on missing or unparsable uptime', () => {
    expect(isUptimeBelowRequirement(undefined)).toBe(false)
    expect(isUptimeBelowRequirement('')).toBe(false)
    expect(isUptimeBelowRequirement('   ')).toBe(false)
    expect(isUptimeBelowRequirement(NaN)).toBe(false)
    expect(isUptimeBelowRequirement('not-a-number')).toBe(false)
    expect(isUptimeBelowRequirement('90%')).toBe(false)
    expect(isUptimeBelowRequirement(Infinity)).toBe(false)
    expect(isUptimeBelowRequirement(null as unknown as undefined)).toBe(false)
    expect(isUptimeBelowRequirement(false as unknown as undefined)).toBe(false)
    expect(isUptimeBelowRequirement([] as unknown as undefined)).toBe(false)
  })
})

describe('getUptimeColor', () => {
  it('is danger strictly below the threshold', () => {
    expect(getUptimeColor(89.99)).toBe('$textDanger')
    expect(getUptimeColor('89.99')).toBe('$textDanger')
    expect(getUptimeColor(0)).toBe('$textDanger')
  })

  it('is success at or above the threshold', () => {
    expect(getUptimeColor(90)).toBe('$textSuccess')
    expect(getUptimeColor('90.00')).toBe('$textSuccess')
    expect(getUptimeColor(100)).toBe('$textSuccess')
  })

  it('is undefined for missing or unparsable uptime', () => {
    expect(getUptimeColor(undefined)).toBeUndefined()
    expect(getUptimeColor('')).toBeUndefined()
    expect(getUptimeColor('not-a-number')).toBeUndefined()
    expect(getUptimeColor(NaN)).toBeUndefined()
    expect(getUptimeColor(null as unknown as undefined)).toBeUndefined()
  })
})
