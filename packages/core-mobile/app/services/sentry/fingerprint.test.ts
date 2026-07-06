import { buildSentryFingerprint } from './fingerprint'

describe('buildSentryFingerprint', () => {
  it('returns [scope, discriminator] when discriminator is a non-empty string', () => {
    expect(buildSentryFingerprint('useFeeEstimation', '0xeda86850')).toEqual([
      'useFeeEstimation',
      '0xeda86850'
    ])
  })

  it('falls back to default grouping when discriminator is undefined', () => {
    expect(buildSentryFingerprint('useFeeEstimation')).toEqual([
      '{{ default }}'
    ])
  })

  it('falls back to default grouping when discriminator is null', () => {
    expect(buildSentryFingerprint('useFeeEstimation', null)).toEqual([
      '{{ default }}'
    ])
  })

  it('falls back to default grouping when discriminator is an empty string', () => {
    expect(buildSentryFingerprint('useFeeEstimation', '')).toEqual([
      '{{ default }}'
    ])
  })
})
