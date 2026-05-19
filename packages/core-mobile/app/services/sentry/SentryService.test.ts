import * as Sentry from '@sentry/react-native'

// ---------------------------------------------------------------------------
// Shared scope mock – reused across all withScope callback invocations
// ---------------------------------------------------------------------------

const mockScope = {
  setContext: jest.fn(),
  setTags: jest.fn(),
  setFingerprint: jest.fn()
}

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn(callback => callback(mockScope)),
  reactNavigationIntegration: jest.fn().mockReturnValue({}),
  getGlobalScope: jest.fn(() => ({ setUser: jest.fn() }))
}))

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: { SENTRY_DSN: 'MOCK_SENTRY_DSN' }
}))

jest.mock('utils/debugging/DevDebuggingConfig', () => ({
  default: { SENTRY_SPOTLIGHT: false }
}))

jest.mock('services/user/UserService', () => ({
  default: { getUniqueID: jest.fn().mockReturnValue('test-user-id') }
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const loadService = (): typeof import('./SentryService').default => {
  return require('./SentryService').default
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SentryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockScope.setContext.mockClear()
    mockScope.setTags.mockClear()
    mockScope.setFingerprint.mockClear()
  })

  // -------------------------------------------------------------------------
  describe('when Sentry is not available (__DEV__ = true, no spotlight)', () => {
    // Default Jest environment has __DEV__ = true and SENTRY_SPOTLIGHT = false
    // → isAvailable = false

    let service: typeof import('./SentryService').default

    beforeAll(() => {
      jest.isolateModules(() => {
        service = loadService()
      })
    })

    describe('captureException', () => {
      it('does not call Sentry.captureException', () => {
        service.captureException('oops')
        expect(Sentry.captureException).not.toHaveBeenCalled()
      })

      it('still no-ops when tags are provided', () => {
        service.captureException('oops', new Error('boom'), {
          source: 'gas-station'
        })
        expect(Sentry.captureException).not.toHaveBeenCalled()
        expect(Sentry.withScope).not.toHaveBeenCalled()
      })
    })

    describe('captureMessage', () => {
      it('does not call Sentry.withScope or Sentry.captureMessage', () => {
        service.captureMessage('hello')
        expect(Sentry.withScope).not.toHaveBeenCalled()
        expect(Sentry.captureMessage).not.toHaveBeenCalled()
      })
    })
  })

  // -------------------------------------------------------------------------
  describe('when Sentry is available (__DEV__ = false)', () => {
    let service: typeof import('./SentryService').default

    beforeAll(() => {
      // __DEV__ = false makes !__DEV__ = true, so isAvailable = true
      // (SENTRY_DSN is set via the react-native-config mock above)
      const g = global as unknown as Record<string, unknown>
      const prevDev = g.__DEV__
      g.__DEV__ = false
      jest.isolateModules(() => {
        service = loadService()
      })
      g.__DEV__ = prevDev
    })

    // -----------------------------------------------------------------------
    describe('captureException', () => {
      it('passes an Error directly with message as extra', () => {
        const error = new Error('original error')
        service.captureException('context message', error)

        expect(Sentry.captureException).toHaveBeenCalledWith(error, {
          extra: { message: 'context message' }
        })
      })

      it('wraps a non-Error value in a new Error and adds value as extra', () => {
        service.captureException('something went wrong', { code: 42 })

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          { extra: { value: { code: 42 } } }
        )
        const [err] = (Sentry.captureException as jest.Mock).mock.calls[0]
        expect(err.message).toBe('something went wrong')
      })

      it('omits the extra hint when value is undefined', () => {
        service.captureException('bare message')

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          undefined
        )
      })

      it('sets tags on the scope when tags are provided', () => {
        const error = new Error('boom')
        service.captureException('context', error, { source: 'gas-station' })

        expect(Sentry.withScope).toHaveBeenCalled()
        expect(mockScope.setTags).toHaveBeenCalledWith({
          source: 'gas-station'
        })
        expect(Sentry.captureException).toHaveBeenCalledWith(error, {
          extra: { message: 'context' }
        })
      })

      it('sets tags when value is non-Error and tags are provided', () => {
        service.captureException('msg', { code: 42 }, { source: 'glacier' })

        expect(mockScope.setTags).toHaveBeenCalledWith({ source: 'glacier' })
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          { extra: { value: { code: 42 } } }
        )
      })

      it('does not set tags or open a scope when no tags provided (preserves existing behavior)', () => {
        service.captureException('msg', new Error('boom'))

        expect(mockScope.setTags).not.toHaveBeenCalled()
        expect(Sentry.withScope).not.toHaveBeenCalled()
      })
    })

    // -----------------------------------------------------------------------
    describe('captureMessage', () => {
      it('sends the message via Sentry.captureMessage', () => {
        service.captureMessage('test message')

        expect(Sentry.captureMessage).toHaveBeenCalledWith('test message')
      })

      it('sets context on the scope when context is provided', () => {
        service.captureMessage('msg', { foo: 'bar' })

        expect(mockScope.setContext).toHaveBeenCalledWith('details', {
          foo: 'bar'
        })
      })

      it('does not call setContext when no context is provided', () => {
        service.captureMessage('msg')

        expect(mockScope.setContext).not.toHaveBeenCalled()
      })

      it('sets tags on the scope when tags are provided', () => {
        service.captureMessage('msg', undefined, { source: 'fusion-sdk' })

        expect(mockScope.setTags).toHaveBeenCalledWith({ source: 'fusion-sdk' })
      })

      it('does not call setTags when no tags are provided', () => {
        service.captureMessage('msg')

        expect(mockScope.setTags).not.toHaveBeenCalled()
      })

      it('sets the fingerprint on the scope when a non-empty fingerprint is provided', () => {
        service.captureMessage('msg', undefined, undefined, [
          'useFeeEstimation',
          '0xeda86850'
        ])

        expect(mockScope.setFingerprint).toHaveBeenCalledWith([
          'useFeeEstimation',
          '0xeda86850'
        ])
      })

      it('does not call setFingerprint when no fingerprint is provided', () => {
        service.captureMessage('msg')

        expect(mockScope.setFingerprint).not.toHaveBeenCalled()
      })

      it('does not call setFingerprint when fingerprint is an empty array', () => {
        service.captureMessage('msg', undefined, undefined, [])

        expect(mockScope.setFingerprint).not.toHaveBeenCalled()
      })

      it('converts bigint values in context to strings', () => {
        service.captureMessage('msg', {
          amount: BigInt('1000000000000000000'),
          nested: { fee: BigInt(500) }
        })

        expect(mockScope.setContext).toHaveBeenCalledWith('details', {
          amount: '1000000000000000000',
          nested: { fee: '500' }
        })
      })

      it('handles context with no bigints unchanged', () => {
        service.captureMessage('msg', { count: 3, label: 'hello' })

        expect(mockScope.setContext).toHaveBeenCalledWith('details', {
          count: 3,
          label: 'hello'
        })
      })

      it('passes { value: "[unserializable]" } to setContext when context cannot be serialized', () => {
        const circular: Record<string, unknown> = {}
        circular.self = circular

        service.captureMessage('msg', circular)

        expect(mockScope.setContext).toHaveBeenCalledWith('details', {
          value: '[unserializable]'
        })
      })
    })
  })
})
