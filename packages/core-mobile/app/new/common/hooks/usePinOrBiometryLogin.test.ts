import { renderHook, act } from '@testing-library/react-hooks'
import { Alert } from 'react-native'
import BiometricsSDK from 'utils/BiometricsSDK'
import KeychainMigrator, { MigrationStatus } from 'utils/KeychainMigrator'
import { usePinOrBiometryLogin } from './usePinOrBiometryLogin'

jest.mock('utils/BiometricsSDK', () => ({
  __esModule: true,
  default: {
    loadEncryptionKeyWithPin: jest.fn(),
    hasAnyWalletData: jest.fn(),
    getAccessType: jest.fn(),
    canUseBiometry: jest.fn(),
    getBiometryType: jest.fn()
  },
  BiometricType: {
    FACE_ID: 'Face ID',
    TOUCH_ID: 'Touch ID',
    BIOMETRICS: 'Biometrics',
    IRIS: 'Iris',
    NONE: 'None'
  }
}))

jest.mock('utils/KeychainMigrator', () => {
  const actual = jest.requireActual('utils/KeychainMigrator')
  const migrateIfNeeded = jest.fn()
  const MockKeychainMigrator = jest
    .fn()
    .mockImplementation(() => ({ migrateIfNeeded }))
  // Expose the shared instance mock so tests can program/assert it.
  Object.assign(MockKeychainMigrator, { migrateIfNeeded })
  return {
    ...actual,
    __esModule: true,
    default: MockKeychainMigrator
  }
})

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => 'wallet-1')
}))

jest.mock('store/wallet/slice', () => ({
  selectActiveWalletId: jest.fn()
}))

const mockDeleteWallet = jest.fn()
jest.mock('./useDeleteWallet', () => ({
  useDeleteWallet: () => ({ deleteWallet: mockDeleteWallet })
}))

const mockIncreaseAttempt = jest.fn()
const mockResetRateLimiter = jest.fn()
jest.mock('./useRateLimiter', () => ({
  useRateLimiter: () => ({
    increaseAttempt: mockIncreaseAttempt,
    attemptAllowed: true,
    reset: mockResetRateLimiter,
    remainingSeconds: 0
  })
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn() }
}))

const mockBiometricsSDK = BiometricsSDK as jest.Mocked<typeof BiometricsSDK>
const mockMigrateIfNeeded = (
  KeychainMigrator as unknown as { migrateIfNeeded: jest.Mock }
).migrateIfNeeded
const mockAlert = jest.spyOn(Alert, 'alert')

// The component implementations run these through animations and invoke the
// completion callback when done; the mocks invoke it synchronously.
const mockOnStartLoading = jest.fn()
const mockOnStopLoading = jest.fn((onComplete?: () => void) => onComplete?.())
const mockOnWrongPin = jest.fn()

const renderLoginHook = (isInitialLogin: boolean) =>
  renderHook(() =>
    usePinOrBiometryLogin({
      onStartLoading: mockOnStartLoading,
      onStopLoading: mockOnStopLoading,
      onWrongPin: mockOnWrongPin,
      isInitialLogin,
      onBiometricPrompt: jest.fn()
    })
  )

const PIN = '123456'

const pressAlertOkay = (): void => {
  const buttons = mockAlert.mock.calls[0]?.[2]
  expect(buttons?.[0]?.text).toBe('Okay')
  buttons?.[0]?.onPress?.()
}

describe('usePinOrBiometryLogin — wiped-keychain recovery (CP-14585)', () => {
  beforeEach(() => {
    mockBiometricsSDK.canUseBiometry.mockResolvedValue(false)
    mockBiometricsSDK.getAccessType.mockReturnValue('PIN')
    mockAlert.mockImplementation(jest.fn())
  })

  it('routes a cold-start PIN entry on a wiped keychain to recovery instead of the wrong-PIN loop', async () => {
    // Full corrupt state: no new encryption keys, no legacy entries — the
    // migrator reports NoKeychainData instead of attempting a legacy
    // migration that would surface as BadPinError.
    mockMigrateIfNeeded.mockResolvedValue({
      success: true,
      value: MigrationStatus.NoKeychainData
    })

    const { result } = renderLoginHook(true)

    await act(async () => {
      result.current.onEnterPin(PIN)
    })

    expect(mockMigrateIfNeeded).toHaveBeenCalledWith('PIN', PIN)
    // Not treated as a wrong PIN...
    expect(mockOnWrongPin).not.toHaveBeenCalled()
    expect(mockIncreaseAttempt).not.toHaveBeenCalled()
    // ...and the encryption key load is never attempted.
    expect(mockBiometricsSDK.loadEncryptionKeyWithPin).not.toHaveBeenCalled()

    // Recovery is gated behind an explicit acknowledgment.
    expect(mockAlert).toHaveBeenCalledWith(
      'Wallet data not found',
      expect.any(String),
      expect.any(Array),
      { cancelable: false }
    )
    expect(mockDeleteWallet).not.toHaveBeenCalled()
    pressAlertOkay()
    expect(mockDeleteWallet).toHaveBeenCalledTimes(1)
  })

  it('recovers via alert when the keychain is empty in an in-session flow (no migration)', async () => {
    mockBiometricsSDK.loadEncryptionKeyWithPin.mockResolvedValue(
      'no-credentials'
    )
    mockBiometricsSDK.hasAnyWalletData.mockResolvedValue(false)

    const { result } = renderLoginHook(false)

    await act(async () => {
      result.current.onEnterPin(PIN)
    })

    // In-session flows skip migration entirely.
    expect(mockMigrateIfNeeded).not.toHaveBeenCalled()
    expect(mockOnWrongPin).not.toHaveBeenCalled()
    expect(mockAlert).toHaveBeenCalledWith(
      'Wallet data not found',
      expect.any(String),
      expect.any(Array),
      { cancelable: false }
    )
    expect(mockDeleteWallet).not.toHaveBeenCalled()
    pressAlertOkay()
    expect(mockDeleteWallet).toHaveBeenCalledTimes(1)
  })

  it('does NOT offer deletion when the PIN key is missing but other wallet data exists (partial bio migration)', async () => {
    mockBiometricsSDK.loadEncryptionKeyWithPin.mockResolvedValue(
      'no-credentials'
    )
    // e.g. runBiometricMigration completed partially: bio key + legacy
    // entries exist, PIN key not yet — the wallet is still recoverable.
    mockBiometricsSDK.hasAnyWalletData.mockResolvedValue(true)

    const { result } = renderLoginHook(false)

    await act(async () => {
      result.current.onEnterPin(PIN)
    })

    expect(mockAlert).not.toHaveBeenCalled()
    expect(mockDeleteWallet).not.toHaveBeenCalled()
    // Surfaces as a failed PIN check (pre-CP-14585 behavior for this state).
    expect(mockOnWrongPin).toHaveBeenCalledTimes(1)
    expect(mockIncreaseAttempt).toHaveBeenCalledTimes(1)
  })

  it('still rate-limits a wrong PIN when the keychain is intact', async () => {
    mockMigrateIfNeeded.mockResolvedValue({
      success: true,
      value: MigrationStatus.NoMigrationNeeded
    })
    mockBiometricsSDK.loadEncryptionKeyWithPin.mockResolvedValue('wrong-pin')

    const { result } = renderLoginHook(true)

    await act(async () => {
      result.current.onEnterPin(PIN)
    })

    expect(mockIncreaseAttempt).toHaveBeenCalledTimes(1)
    expect(mockOnWrongPin).toHaveBeenCalledTimes(1)
    expect(mockAlert).not.toHaveBeenCalled()
    expect(mockDeleteWallet).not.toHaveBeenCalled()
    expect(result.current.verified).toBe(false)
  })

  it('verifies a correct PIN when the keychain is intact', async () => {
    mockMigrateIfNeeded.mockResolvedValue({
      success: true,
      value: MigrationStatus.NoMigrationNeeded
    })
    mockBiometricsSDK.loadEncryptionKeyWithPin.mockResolvedValue('success')

    const { result } = renderLoginHook(true)

    await act(async () => {
      result.current.onEnterPin(PIN)
    })

    expect(result.current.verified).toBe(true)
    expect(mockResetRateLimiter).toHaveBeenCalled()
    expect(mockAlert).not.toHaveBeenCalled()
    expect(mockDeleteWallet).not.toHaveBeenCalled()
  })

  it('routes a cold-start biometric login on a wiped keychain to the same recovery', async () => {
    mockBiometricsSDK.getAccessType.mockReturnValue('BIO')
    mockMigrateIfNeeded.mockResolvedValue({
      success: true,
      value: MigrationStatus.NoKeychainData
    })

    const { result } = renderLoginHook(true)

    await act(async () => {
      await result.current.verifyBiometric()
    })

    expect(mockMigrateIfNeeded).toHaveBeenCalledWith('BIO')
    expect(mockAlert).toHaveBeenCalledWith(
      'Wallet data not found',
      expect.any(String),
      expect.any(Array),
      { cancelable: false }
    )
    expect(mockDeleteWallet).not.toHaveBeenCalled()
    pressAlertOkay()
    expect(mockDeleteWallet).toHaveBeenCalledTimes(1)
    expect(result.current.verified).toBe(false)
  })
})
