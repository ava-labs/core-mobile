import { isAppVersionOutdated, parseNumericVersion } from './appVersion'

describe('parseNumericVersion', () => {
  it.each([
    ['1.2.3', [1, 2, 3]],
    ['0.0.0', [0, 0, 0]],
    ['10.20.300', [10, 20, 300]]
  ])('parses %s', (input, expected) => {
    expect(parseNumericVersion(input)).toEqual(expected)
  })

  it.each([
    '',
    '1',
    '1.2',
    '1.2.3.4',
    'v1.2.3',
    '1.2.3-rc1',
    '1.2.3+build',
    ' 1.2.3',
    '1.2.3 ',
    '1_2_3',
    '1.x.3',
    '1..3'
  ])('rejects %p', input => {
    expect(parseNumericVersion(input)).toBeUndefined()
  })

  it.each([undefined, null, 123, true, {}, ['1', '2', '3']])(
    'rejects non-string %p',
    input => {
      expect(parseNumericVersion(input)).toBeUndefined()
    }
  )
})

describe('isAppVersionOutdated', () => {
  it.each([
    ['1.2.2', '1.2.3'],
    ['1.1.9', '1.2.0'],
    ['0.9.9', '1.0.0'],
    ['1.2.3', '1.10.0']
  ])('%s is older than %s', (installed, recommended) => {
    expect(isAppVersionOutdated(installed, recommended)).toBe(true)
  })

  it.each([
    ['1.2.3', '1.2.3'],
    ['1.2.4', '1.2.3'],
    ['2.0.0', '1.9.9'],
    ['1.10.0', '1.9.0']
  ])('%s is not older than %s', (installed, recommended) => {
    expect(isAppVersionOutdated(installed, recommended)).toBe(false)
  })

  it.each([
    ['', '1.2.3'],
    ['1.2', '1.2.3'],
    ['1.2.2-rc', '1.2.3'],
    ['1.2.2', ''],
    ['1.2.2', undefined],
    ['1.2.2', '1.2'],
    ['1.2.2', '1_2_3']
  ])(
    'never reports outdated when a version is unreadable (%p vs %p)',
    (installed, recommended) => {
      expect(isAppVersionOutdated(installed, recommended)).toBe(false)
    }
  )
})
