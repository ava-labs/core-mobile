import {
  countEnabledFilters,
  createDefaultDelegateFilters,
  DelegateFilters,
  disableAllDelegateFilters,
  resolveEffectiveDelegateFilters,
  useDelegateFilters
} from './store'

const BASELINE = createDefaultDelegateFilters({
  minFeePercent: 2,
  minStakeDays: 14
})

const allOff = disableAllDelegateFilters

describe('resolveEffectiveDelegateFilters', () => {
  it('falls back to the baseline for dimensions the user has not enabled', () => {
    const effective = resolveEffectiveDelegateFilters(
      allOff(BASELINE),
      BASELINE
    )
    expect(effective).toEqual(BASELINE)
  })

  it('replaces the baseline with a user-enabled dimension (loosening works)', () => {
    const userFilters: DelegateFilters = {
      ...allOff(BASELINE),
      uptime: { enabled: true, min: 40 } // below the 75% baseline
    }
    const effective = resolveEffectiveDelegateFilters(userFilters, BASELINE)
    expect(effective.uptime).toEqual({ enabled: true, min: 40 })
    // Untouched dimensions still filter at the baseline.
    expect(effective.maxFee).toEqual(BASELINE.maxFee)
    expect(effective.minTimeRemaining).toEqual(BASELINE.minTimeRemaining)
  })
})

describe('countEnabledFilters', () => {
  it('is 0 right after seeding, so the picker opens without a badge', () => {
    useDelegateFilters.getState().seedDefaults(BASELINE)
    expect(countEnabledFilters(useDelegateFilters.getState().filters)).toBe(0)
  })

  it('counts every toggled-on filter, even at its baseline value', () => {
    const userFilters: DelegateFilters = {
      uptime: { ...BASELINE.uptime, enabled: true },
      maxFee: { ...BASELINE.maxFee, enabled: true },
      minAvailable: { enabled: true, value: 100 },
      minTimeRemaining: { ...BASELINE.minTimeRemaining, enabled: false }
    }
    expect(countEnabledFilters(userFilters)).toBe(3)
  })
})

describe('useDelegateFilters.seedDefaults', () => {
  afterEach(() => {
    useDelegateFilters.getState().reset()
  })

  it('stores the baseline and opens the user filters all-off at baseline values', () => {
    useDelegateFilters.getState().seedDefaults(BASELINE)
    const { filters, defaults } = useDelegateFilters.getState()
    expect(defaults).toEqual(BASELINE)
    expect(filters).toEqual(allOff(BASELINE))
  })

  it('applied filters round-trip verbatim through setFilters', () => {
    useDelegateFilters.getState().seedDefaults(BASELINE)
    const applied: DelegateFilters = {
      ...allOff(BASELINE),
      maxFee: { enabled: true, value: BASELINE.maxFee.value } // on at default
    }
    useDelegateFilters.getState().setFilters(applied)
    // The sheet reopens with exactly what was applied — an enabled row at its
    // baseline value must NOT collapse back to "off" (CP-14832).
    expect(useDelegateFilters.getState().filters).toEqual(applied)
    expect(countEnabledFilters(useDelegateFilters.getState().filters)).toBe(1)
  })
})
