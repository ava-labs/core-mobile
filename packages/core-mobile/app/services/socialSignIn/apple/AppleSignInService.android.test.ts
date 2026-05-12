import { appleAuthAndroid } from '@invertase/react-native-apple-authentication'
import Logger from 'utils/Logger'

jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuthAndroid: {
    isSupported: true,
    configure: jest.fn(),
    signIn: jest.fn(),
    Scope: { EMAIL: 'EMAIL' },
    ResponseType: { ALL: 'ALL' },
    Error: { SIGNIN_CANCELLED: 'SIGNIN_CANCELLED' }
  }
}))

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    APPLE_OAUTH_CLIENT_ID: 'test-client-id',
    APPLE_OAUTH_REDIRECT_URL: 'https://test.example/redirect'
  }
}))

jest.mock('services/deviceInfo/DeviceInfoService', () => ({
  __esModule: true,
  default: { getAppNameSpace: () => 'test.app' }
}))

jest.spyOn(Logger, 'error').mockImplementation(jest.fn())
jest.spyOn(Logger, 'warn').mockImplementation(jest.fn())

const signInMock = appleAuthAndroid.signIn as jest.Mock

const AppleSignInService = require('./AppleSignInService.android').default as {
  signIn: () => Promise<{ oidcToken: string }>
  isSupported: () => boolean
}

describe('AppleSignInService.android', () => {
  describe('generic catch (non-cancellation, non-empty-token)', () => {
    it('preserves the underlying error message in the rethrown error', async () => {
      signInMock.mockRejectedValueOnce(new Error('apple_sdk_timeout'))

      await expect(AppleSignInService.signIn()).rejects.toThrow(
        /Android Apple sign in error.*apple_sdk_timeout/
      )
    })

    it('includes the underlying error code when present', async () => {
      const sdkError = Object.assign(new Error('network down'), {
        code: 'ERR_NO_NETWORK'
      })
      signInMock.mockRejectedValueOnce(sdkError)

      await expect(AppleSignInService.signIn()).rejects.toThrow(
        /ERR_NO_NETWORK|network down/
      )
    })

    it('passes the original error to Logger.error so Sentry sees the cause', async () => {
      const underlying = new Error('cubist_unreachable')
      signInMock.mockRejectedValueOnce(underlying)

      await expect(AppleSignInService.signIn()).rejects.toThrow()

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('cubist_unreachable'),
        underlying
      )
    })
  })

  describe('preserved behavior', () => {
    it('still throws USER_CANCELED when the user cancels', async () => {
      const cancelled = Object.assign(new Error('cancelled'), {
        code: 'SIGNIN_CANCELLED'
      })
      signInMock.mockRejectedValueOnce(cancelled)

      await expect(AppleSignInService.signIn()).rejects.toThrow('USER_CANCELED')
    })

    it('throws "empty token" when id_token is missing', async () => {
      signInMock.mockResolvedValueOnce({ id_token: undefined })

      await expect(AppleSignInService.signIn()).rejects.toThrow(
        /Android Apple sign in error: empty token/
      )
    })

    it('returns the oidcToken on success', async () => {
      signInMock.mockResolvedValueOnce({ id_token: 'real-token' })

      await expect(AppleSignInService.signIn()).resolves.toEqual({
        oidcToken: 'real-token'
      })
    })
  })
})
