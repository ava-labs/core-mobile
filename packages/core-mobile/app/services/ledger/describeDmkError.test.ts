import { describeDmkError } from './describeDmkError'

describe('describeDmkError', () => {
  it('returns an Error message as is', () => {
    expect(describeDmkError(new Error('boom'))).toBe('boom')
  })

  it('includes the errorCode', () => {
    expect(
      describeDmkError({
        _tag: 'GlobalCommandError',
        errorCode: '5515',
        message: 'Device is locked.'
      })
    ).toBe('GlobalCommandError: 5515: Device is locked.')
  })

  it('appends the originalError message', () => {
    expect(
      describeDmkError({
        _tag: 'UnknownDeviceExchangeError',
        originalError: new Error('ble reset')
      })
    ).toBe('UnknownDeviceExchangeError: ble reset')
  })

  it('falls back to JSON for untagged objects', () => {
    expect(describeDmkError({ foo: 1 })).toBe('{"foo":1}')
  })

  it('stringifies primitives', () => {
    expect(describeDmkError('x')).toBe('x')
    expect(describeDmkError(undefined)).toBe('undefined')
  })
})
