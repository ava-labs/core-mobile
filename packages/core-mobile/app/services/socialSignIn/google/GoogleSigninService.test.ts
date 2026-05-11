import Logger from 'utils/Logger'

jest.mock('@react-native-google-signin/google-signin', () => {
  const SIGN_IN_CANCELLED = 'SIGN_IN_CANCELLED'
  return {
    __esModule: true,
    GoogleSignin: {
      configure: jest.fn(),
      signIn: jest.fn()
    },
    statusCodes: { SIGN_IN_CANCELLED },
    isErrorWithCode: (e: unknown) =>
      typeof e === 'object' && e !== null && 'code' in e
  }
})

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    GOOGLE_OAUTH_CLIENT_WEB_ID: 'test-web-id',
    GOOGLE_OAUTH_CLIENT_IOS_ID: 'test-ios-id'
  }
}))

jest.spyOn(Logger, 'error').mockImplementation(jest.fn())
jest.spyOn(Logger, 'warn').mockImplementation(jest.fn())

const {
  GoogleSignin,
  statusCodes
} = require('@react-native-google-signin/google-signin')

const signInMock = GoogleSignin.signIn as jest.Mock

const GoogleSigninService = require('./GoogleSigninService').default as {
  signin: () => Promise<{ oidcToken: string }>
}

describe('GoogleSigninService', () => {
  describe('generic catch (non-cancellation, non-empty-token)', () => {
    it('rethrows the original Error so the caller sees underlying detail', async () => {
      const underlying = new Error('Network request failed')
      signInMock.mockRejectedValueOnce(underlying)

      await expect(GoogleSigninService.signin()).rejects.toThrow(
        'Network request failed'
      )
    })

    it('logs the underlying error message to Sentry (not just generic title)', async () => {
      const underlying = new Error('Network request failed')
      signInMock.mockRejectedValueOnce(underlying)

      await expect(GoogleSigninService.signin()).rejects.toThrow()

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Network request failed'),
        underlying
      )
    })

    it('logs the underlying error code to Sentry when present', async () => {
      const sdkError = Object.assign(new Error('something bad'), {
        code: 'NETWORK_ERROR'
      })
      signInMock.mockRejectedValueOnce(sdkError)

      await expect(GoogleSigninService.signin()).rejects.toThrow()

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('NETWORK_ERROR'),
        sdkError
      )
    })

    it('preserves detail when the SDK throws a non-Error value', async () => {
      signInMock.mockRejectedValueOnce({
        code: 'PLAY_SERVICES_NOT_AVAILABLE',
        message: 'play services missing'
      })

      await expect(GoogleSigninService.signin()).rejects.toThrow(
        /PLAY_SERVICES_NOT_AVAILABLE/
      )
    })
  })

  describe('preserved behavior', () => {
    it('still throws USER_CANCELED when the user cancels', async () => {
      const cancelled = Object.assign(new Error('cancelled'), {
        code: statusCodes.SIGN_IN_CANCELLED
      })
      signInMock.mockRejectedValueOnce(cancelled)

      await expect(GoogleSigninService.signin()).rejects.toThrow(
        'USER_CANCELED'
      )
    })

    it('throws "empty token" when idToken is missing', async () => {
      signInMock.mockResolvedValueOnce({ data: { idToken: undefined } })

      await expect(GoogleSigninService.signin()).rejects.toThrow(
        /Google sign in error: empty token/
      )
    })

    it('returns the oidcToken on success', async () => {
      signInMock.mockResolvedValueOnce({ data: { idToken: 'real-token' } })

      await expect(GoogleSigninService.signin()).resolves.toEqual({
        oidcToken: 'real-token'
      })
    })
  })
})
