import appleAuth from '@invertase/react-native-apple-authentication'
import Logger from 'utils/Logger'

jest.mock('@invertase/react-native-apple-authentication', () => {
  const mock = {
    isSupported: true,
    performRequest: jest.fn(),
    getCredentialStateForUser: jest.fn(),
    Operation: { LOGIN: 'LOGIN' },
    Scope: { EMAIL: 'EMAIL' },
    State: { AUTHORIZED: 'AUTHORIZED' },
    Error: { CANCELED: 'CANCELED' }
  }
  return { __esModule: true, default: mock }
})

jest.spyOn(Logger, 'error').mockImplementation(jest.fn())

const performRequestMock = appleAuth.performRequest as jest.Mock
const getCredentialStateMock = appleAuth.getCredentialStateForUser as jest.Mock

const AppleSignInService = require('./AppleSignInService').default as {
  signIn: () => Promise<{ oidcToken: string }>
}

describe('AppleSignInService (iOS)', () => {
  describe('generic catch (non-cancellation, non-structured)', () => {
    it('preserves the underlying error message in the rethrown error', async () => {
      performRequestMock.mockRejectedValueOnce(new Error('apple_sdk_timeout'))

      await expect(AppleSignInService.signIn()).rejects.toThrow(
        /iOS Apple sign in error.*apple_sdk_timeout/
      )
    })

    it('includes the underlying error code when present', async () => {
      const sdkError = Object.assign(new Error('failure'), {
        code: 'ERR_KEYCHAIN'
      })
      performRequestMock.mockRejectedValueOnce(sdkError)

      await expect(AppleSignInService.signIn()).rejects.toThrow(
        /ERR_KEYCHAIN|failure/
      )
    })

    it('passes the original error to Logger.error so Sentry sees the cause', async () => {
      const underlying = new Error('cubist_unreachable')
      performRequestMock.mockRejectedValueOnce(underlying)

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
        code: 'CANCELED'
      })
      performRequestMock.mockRejectedValueOnce(cancelled)

      await expect(AppleSignInService.signIn()).rejects.toThrow('USER_CANCELED')
    })

    it('preserves "empty token" detail through the catch', async () => {
      performRequestMock.mockResolvedValueOnce({
        identityToken: undefined,
        user: 'u1'
      })

      await expect(AppleSignInService.signIn()).rejects.toThrow(
        /iOS Apple sign in error: empty token/
      )
    })

    it('preserves "user not found" detail through the catch', async () => {
      performRequestMock.mockResolvedValueOnce({
        identityToken: 'tok',
        user: null
      })

      await expect(AppleSignInService.signIn()).rejects.toThrow(
        /iOS Apple sign in error: user not found/
      )
    })

    it('preserves "unauthorized user" detail through the catch', async () => {
      performRequestMock.mockResolvedValueOnce({
        identityToken: 'tok',
        user: 'u1'
      })
      getCredentialStateMock.mockResolvedValueOnce('NOT_FOUND')

      await expect(AppleSignInService.signIn()).rejects.toThrow(
        /iOS Apple sign in error.*unauthorized user/
      )
    })

    it('returns the oidcToken on success', async () => {
      performRequestMock.mockResolvedValueOnce({
        identityToken: 'real-token',
        user: 'u1'
      })
      getCredentialStateMock.mockResolvedValueOnce('AUTHORIZED')

      await expect(AppleSignInService.signIn()).resolves.toEqual({
        oidcToken: 'real-token'
      })
    })
  })
})
