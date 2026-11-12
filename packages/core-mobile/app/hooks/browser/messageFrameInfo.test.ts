import Logger from 'utils/Logger'
import { getMessageFrameInfo } from './messageFrameInfo'

// `getMessageFrameInfo` reports missing provenance only once per module
// instance, so the tests that exercise that latch need a fresh module — and a
// fresh module registry brings its own `react-native`, which is where the
// platform has to be set.
const callOnPlatform = (
  os: 'ios' | 'android',
  calls: number
): jest.SpyInstance => {
  const errorSpy = jest
    .spyOn(Logger, 'error')
    .mockImplementation(() => undefined)

  jest.isolateModules(() => {
    const RN = require('react-native')
    Object.defineProperty(RN.Platform, 'OS', { configurable: true, value: os })

    const fresh = require('./messageFrameInfo').getMessageFrameInfo

    for (let i = 0; i < calls; i++) fresh({})
  })

  return errorSpy
}

describe('getMessageFrameInfo', () => {
  beforeEach(() => jest.restoreAllMocks())

  it('passes through the platform-reported main frame flag and origin', () => {
    expect(
      getMessageFrameInfo({
        isMainFrame: true,
        frameOrigin: 'https://example.com'
      })
    ).toEqual({ isMainFrame: true, frameOrigin: 'https://example.com' })

    expect(
      getMessageFrameInfo({
        isMainFrame: false,
        frameOrigin: 'https://ad.evil.example'
      })
    ).toEqual({ isMainFrame: false, frameOrigin: 'https://ad.evil.example' })
  })

  it('keeps a non-default port so the origin still compares equal to new URL(...).origin', () => {
    expect(
      getMessageFrameInfo({
        isMainFrame: true,
        frameOrigin: 'http://localhost:3000'
      }).frameOrigin
    ).toBe('http://localhost:3000')
  })

  it.each([
    ['iOS opaque origin', ''],
    ['Android opaque origin', 'null'],
    ['field absent', undefined]
  ])('normalizes an unusable frame origin (%s) to undefined', (_, value) => {
    // An opaque origin (about:blank, data:, srcdoc, sandboxed frame) is not an
    // origin anything should be compared against — collapsing the platforms'
    // two spellings plus "absent" to undefined leaves callers one case to check.
    expect(
      getMessageFrameInfo({ isMainFrame: true, frameOrigin: value }).frameOrigin
    ).toBeUndefined()
  })

  it('reports undefined provenance as undefined rather than false', () => {
    // Android's legacy addJavascriptInterface bridge cannot tell us which frame
    // posted. Callers must be able to distinguish "not the main frame" from
    // "unknown", so this must never be coerced to a boolean.
    expect(getMessageFrameInfo({}).isMainFrame).toBeUndefined()
  })

  it('reports missing provenance once on iOS, where it means the webview patch was lost', () => {
    // iOS always populates both fields via the fork patch, so their absence is
    // a broken build that refuses every provider request as unattributable —
    // worth an error, but only one: this runs on every message.
    const errorSpy = callOnPlatform('ios', 2)

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0]?.[0]).toContain('frame provenance')
  })

  it('stays quiet on Android, where the legacy bridge genuinely cannot supply provenance', () => {
    expect(callOnPlatform('android', 2)).not.toHaveBeenCalled()
  })
})
