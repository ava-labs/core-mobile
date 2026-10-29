const loadCountryCode = (
  locales: { regionCode: string }[]
): string | undefined => {
  let value: string | undefined
  jest.isolateModules(() => {
    jest.doMock('expo-localization', () => ({
      getLocales: () => locales,
      useLocales: () => locales
    }))
    const { useMeldCountryCode } =
      jest.requireActual<typeof import('./store')>('./store')
    value = useMeldCountryCode.getState()
  })
  return value
}

describe('useMeldCountryCode', () => {
  it('defaults to the uppercased device region', () => {
    expect(loadCountryCode([{ regionCode: 'de' }])).toBe('DE')
  })

  it('falls back to US without a device region', () => {
    expect(loadCountryCode([])).toBe('US')
  })
})
