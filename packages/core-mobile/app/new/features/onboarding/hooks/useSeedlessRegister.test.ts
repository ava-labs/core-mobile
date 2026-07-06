import { renderHook, act } from '@testing-library/react-hooks'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SecureStorageService from 'security/SecureStorageService'
import { OidcProviders } from 'seedless/consts'
import { useSeedlessRegister } from './useSeedlessRegister'

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => false)
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))

jest.mock('seedless/services/SeedlessService', () => ({
  __esModule: true,
  default: {
    session: {
      oidcProveIdentity: jest.fn(),
      requestOidcAuth: jest.fn()
    }
  }
}))

jest.mock('seedless/services/CoreSeedlessAPIService', () => ({
  __esModule: true,
  default: { register: jest.fn() },
  SeedlessUserRegistrationResult: {
    ALREADY_REGISTERED: 'ALREADY_REGISTERED',
    APPROVED: 'APPROVED',
    ERROR: 'ERROR'
  }
}))

jest.mock('security/SecureStorageService', () => ({
  __esModule: true,
  default: { store: jest.fn() },
  KeySlot: { OidcUserId: 'OidcUserId', OidcProvider: 'OidcProvider' }
}))

jest.mock('services/passkey/PasskeyService', () => ({
  __esModule: true,
  default: { isSupported: false }
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}))

jest.mock('new/common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

jest.mock('common/hooks/useLogoModal', () => ({
  useLogoModal: () => ({
    showLogoModal: jest.fn(),
    hideLogoModal: jest.fn()
  })
}))

const mockSetIsNewSeedlessUser = jest.fn()
jest.mock('../contexts/RecoveryMethodProvider', () => ({
  useRecoveryMethodContext: () => ({
    setIsNewSeedlessUser: mockSetIsNewSeedlessUser
  })
}))

const captureMock = AnalyticsService.capture as jest.Mock
const oidcProveIdentityMock = SeedlessService.session
  .oidcProveIdentity as jest.Mock
const requestOidcAuthMock = SeedlessService.session.requestOidcAuth as jest.Mock
const apiRegisterMock = CoreSeedlessAPIService.register as jest.Mock
const secureStoreMock = SecureStorageService.store as jest.Mock

const callbacks = {
  onRegisterMfaMethods: jest.fn(),
  onVerifyMfaMethod: jest.fn(),
  onAccountVerified: jest.fn()
}

const validIdentity = {
  email: 'user@example.test',
  user_info: { configured_mfa: [] }
}

describe('useSeedlessRegister.register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    oidcProveIdentityMock.mockResolvedValue(validIdentity)
    apiRegisterMock.mockResolvedValue(SeedlessUserRegistrationResult.APPROVED)
    requestOidcAuthMock.mockResolvedValue({
      requiresMfa: () => false,
      mfaId: () => undefined
    })
    secureStoreMock.mockResolvedValue(undefined)
  })

  describe('per-stage failure capture', () => {
    it('captures stage="oidc-token" when getOidcToken throws', async () => {
      const getOidcToken = jest
        .fn()
        .mockRejectedValueOnce(new Error('Google sign in error: empty token'))

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.GOOGLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.objectContaining({
          stage: 'oidc-token',
          oidcProvider: OidcProviders.GOOGLE,
          reason: 'Google sign in error: empty token'
        })
      )
    })

    it('captures stage="identity-proof" when oidcProveIdentity throws', async () => {
      oidcProveIdentityMock.mockRejectedValueOnce(
        new Error('cubist_unreachable')
      )
      const getOidcToken = jest.fn().mockResolvedValue({ oidcToken: 'tok' })

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.APPLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.objectContaining({
          stage: 'identity-proof',
          oidcProvider: OidcProviders.APPLE,
          reason: 'cubist_unreachable'
        })
      )
    })

    it('captures stage="register" when CoreSeedlessAPIService.register throws', async () => {
      apiRegisterMock.mockRejectedValueOnce(new Error('app_check_failure'))
      const getOidcToken = jest.fn().mockResolvedValue({ oidcToken: 'tok' })

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.GOOGLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.objectContaining({
          stage: 'register',
          oidcProvider: OidcProviders.GOOGLE,
          reason: 'app_check_failure'
        })
      )
    })

    it('captures stage="auth" when requestOidcAuth throws', async () => {
      requestOidcAuthMock.mockRejectedValueOnce(new Error('INTERNAL_ERROR'))
      const getOidcToken = jest.fn().mockResolvedValue({ oidcToken: 'tok' })

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.APPLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.objectContaining({
          stage: 'auth',
          reason: 'INTERNAL_ERROR'
        })
      )
    })

    it('captures stage="secure-store" when SecureStorageService.store throws', async () => {
      secureStoreMock.mockRejectedValueOnce(new Error('keychain_locked'))
      const getOidcToken = jest.fn().mockResolvedValue({ oidcToken: 'tok' })

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.GOOGLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.objectContaining({
          stage: 'secure-store',
          reason: 'keychain_locked'
        })
      )
    })

    it('captures errorCode when the underlying error has an errorCode property', async () => {
      const sdkError = Object.assign(new Error('boom'), {
        errorCode: 'NETWORK_ERROR'
      })
      apiRegisterMock.mockRejectedValueOnce(sdkError)
      const getOidcToken = jest.fn().mockResolvedValue({ oidcToken: 'tok' })

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.GOOGLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.objectContaining({
          stage: 'register',
          errorCode: 'NETWORK_ERROR'
        })
      )
    })

    it('captures errorCode when the underlying error has a code property', async () => {
      const sdkError = Object.assign(new Error('cancelled by os'), {
        code: 'GMS_FAILED'
      })
      apiRegisterMock.mockRejectedValueOnce(sdkError)
      const getOidcToken = jest.fn().mockResolvedValue({ oidcToken: 'tok' })

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.APPLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.objectContaining({
          stage: 'register',
          errorCode: 'GMS_FAILED'
        })
      )
    })

    it('captures stage="register" when register() returns the ERROR sentinel', async () => {
      apiRegisterMock.mockResolvedValueOnce(
        SeedlessUserRegistrationResult.ERROR
      )
      const getOidcToken = jest.fn().mockResolvedValue({ oidcToken: 'tok' })

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.GOOGLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.objectContaining({
          stage: 'register',
          reason: 'ERROR'
        })
      )
    })

    it('still captures analytics when underlying error has hostile getter on .message/.code', async () => {
      class Hostile extends Error {
        get code(): string {
          throw new Error('getter blew up')
        }
      }
      apiRegisterMock.mockRejectedValueOnce(new Hostile('readable'))
      const getOidcToken = jest.fn().mockResolvedValue({ oidcToken: 'tok' })

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.GOOGLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.objectContaining({ stage: 'register' })
      )
    })
  })

  describe('preserved behavior', () => {
    it('does not capture analytics when user cancels (USER_CANCELED)', async () => {
      const getOidcToken = jest
        .fn()
        .mockRejectedValueOnce(new Error('USER_CANCELED'))

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await expect(
          result.current.register({
            getOidcToken,
            oidcProvider: OidcProviders.GOOGLE,
            ...callbacks
          })
        ).rejects.toThrow()
      })

      expect(captureMock).not.toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.anything()
      )
    })

    it('does not capture SeedlessLoginFailed on the success path', async () => {
      const getOidcToken = jest.fn().mockResolvedValue({ oidcToken: 'tok' })

      const { result } = renderHook(() => useSeedlessRegister())

      await act(async () => {
        await result.current.register({
          getOidcToken,
          oidcProvider: OidcProviders.GOOGLE,
          ...callbacks
        })
      })

      expect(captureMock).not.toHaveBeenCalledWith(
        'SeedlessLoginFailed',
        expect.anything()
      )
    })
  })
})
