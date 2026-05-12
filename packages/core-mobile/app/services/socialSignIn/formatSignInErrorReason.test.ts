import { formatSignInErrorReason } from './formatSignInErrorReason'

describe('formatSignInErrorReason', () => {
  it('returns the message for a plain Error', () => {
    expect(formatSignInErrorReason(new Error('boom'))).toBe('boom')
  })

  it('prefixes with code when present', () => {
    const e = Object.assign(new Error('boom'), { code: 'ERR_X' })
    expect(formatSignInErrorReason(e)).toBe('ERR_X: boom')
  })

  it('omits code when value is undefined', () => {
    const e = Object.assign(new Error('boom'), { code: undefined })
    expect(formatSignInErrorReason(e)).toBe('boom')
  })

  it('omits code when value is null', () => {
    const e = Object.assign(new Error('boom'), { code: null })
    expect(formatSignInErrorReason(e)).toBe('boom')
  })

  it('handles non-Error throwables (string)', () => {
    expect(formatSignInErrorReason('something failed')).toBe('something failed')
  })

  it('handles non-Error throwables (plain object with code)', () => {
    expect(
      formatSignInErrorReason({ code: 'X', toString: () => 'plainObj' })
    ).toBe('X: plainObj')
  })

  it('does NOT throw when error has a getter that throws on .message', () => {
    class HostileMessage extends Error {
      get message(): string {
        throw new Error('inner failure')
      }
    }
    const e = new HostileMessage()
    expect(() => formatSignInErrorReason(e)).not.toThrow()
    expect(typeof formatSignInErrorReason(e)).toBe('string')
  })

  it('does NOT throw when error has a getter that throws on .code', () => {
    class HostileCode extends Error {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get code(): any {
        throw new Error('inner failure')
      }
    }
    const e = new HostileCode('readable')
    expect(() => formatSignInErrorReason(e)).not.toThrow()
    expect(typeof formatSignInErrorReason(e)).toBe('string')
  })

  it('does NOT throw when error is null', () => {
    expect(() => formatSignInErrorReason(null)).not.toThrow()
  })

  it('does NOT throw when error is undefined', () => {
    expect(() => formatSignInErrorReason(undefined)).not.toThrow()
  })
})
