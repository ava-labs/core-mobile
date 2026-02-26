describe('getDayString', () => {
  let getDayString: (timestamp: number, monthFormat?: 'short' | 'long') => string

  beforeEach(() => {
    jest.useFakeTimers()
    // Freeze time to July 15, 2025 noon (local time) so module-level
    // endOfToday() / endOfYesterday() constants are deterministic
    jest.setSystemTime(new Date(2025, 6, 15, 12, 0, 0))
    jest.resetModules()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    getDayString = require('./getDayString').getDayString
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns "Today" for a timestamp on the current day', () => {
    const today = new Date(2025, 6, 15, 10, 0, 0).getTime()
    expect(getDayString(today)).toBe('Today')
  })

  it('returns "Yesterday" for a timestamp on the previous day', () => {
    const yesterday = new Date(2025, 6, 14, 10, 0, 0).getTime()
    expect(getDayString(yesterday)).toBe('Yesterday')
  })

  describe('same year (not today or yesterday)', () => {
    const march3rd2025 = new Date(2025, 2, 3, 12, 0, 0).getTime()

    it('returns long month name by default', () => {
      expect(getDayString(march3rd2025)).toBe('March 3rd')
    })

    it('returns long month name when monthFormat is "long"', () => {
      expect(getDayString(march3rd2025, 'long')).toBe('March 3rd')
    })

    it('returns abbreviated month name when monthFormat is "short"', () => {
      expect(getDayString(march3rd2025, 'short')).toBe('Mar 3rd')
    })
  })

  describe('different year', () => {
    const sep30th2020 = new Date(2020, 8, 30, 12, 0, 0).getTime()

    it('returns long month name with year by default', () => {
      expect(getDayString(sep30th2020)).toBe('September 30, 2020')
    })

    it('returns long month name with year when monthFormat is "long"', () => {
      expect(getDayString(sep30th2020, 'long')).toBe('September 30, 2020')
    })

    it('returns abbreviated month name with year when monthFormat is "short"', () => {
      expect(getDayString(sep30th2020, 'short')).toBe('Sep 30, 2020')
    })
  })
})
