import { getFingerprintForFeeEstimationError } from './useFeeEstimation.helpers'

describe('getFingerprintForFeeEstimationError', () => {
  it('returns details.data when present', () => {
    const error = { details: { data: '0xeda86850' } } // TargetCallFailed
    expect(getFingerprintForFeeEstimationError(error)).toEqual([
      'useFeeEstimation',
      '0xeda86850'
    ])
  })

  it('falls back to default grouping when details is missing', () => {
    expect(getFingerprintForFeeEstimationError({})).toEqual(['{{ default }}'])
  })

  it('falls back to default grouping when details.data is missing', () => {
    expect(getFingerprintForFeeEstimationError({ details: {} })).toEqual([
      '{{ default }}'
    ])
  })

  it('falls back to default grouping when details is null', () => {
    expect(getFingerprintForFeeEstimationError({ details: null })).toEqual([
      '{{ default }}'
    ])
  })

  it('falls back to default grouping when details.data is not a string', () => {
    expect(
      getFingerprintForFeeEstimationError({ details: { data: 1234 } })
    ).toEqual(['{{ default }}'])
  })

  it('falls back to default grouping when error is null', () => {
    expect(getFingerprintForFeeEstimationError(null)).toEqual(['{{ default }}'])
  })

  it('falls back to default grouping when error is a primitive', () => {
    expect(getFingerprintForFeeEstimationError('oops')).toEqual([
      '{{ default }}'
    ])
  })
})
