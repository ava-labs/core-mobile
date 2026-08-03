import BiometricsSDK from 'utils/BiometricsSDK'
import { ensureWalletSecret } from './ensureWalletSecret'

jest.mock('utils/BiometricsSDK', () => ({
  __esModule: true,
  default: { loadWalletSecret: jest.fn(), hasLegacyWalletData: jest.fn() }
}))
jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() }
}))

const mockLoadWalletSecret = BiometricsSDK.loadWalletSecret as jest.Mock
const mockHasLegacyWalletData = BiometricsSDK.hasLegacyWalletData as jest.Mock

describe('ensureWalletSecret', () => {
  const walletId = 'wallet-1'

  beforeEach(() => {
    // Default: no legacy entries — the terminal cases below are only allowed
    // to recover destructively when nothing re-creatable remains. (CP-14585)
    mockHasLegacyWalletData.mockResolvedValue(false)
  })

  it('returns true and does not recover when the wallet secret loads', async () => {
    mockLoadWalletSecret.mockResolvedValue({ success: true, value: 'secret' })
    const onMissing = jest.fn()

    const result = await ensureWalletSecret(walletId, onMissing)

    expect(result).toBe(true)
    expect(onMissing).not.toHaveBeenCalled()
  })

  it('returns false and triggers recovery when the wallet secret is gone', async () => {
    mockLoadWalletSecret.mockResolvedValue({
      success: false,
      error: new Error('No credentials found')
    })
    const onMissing = jest.fn()

    const result = await ensureWalletSecret(walletId, onMissing)

    expect(result).toBe(false)
    expect(onMissing).toHaveBeenCalledTimes(1)
  })

  it('returns false and triggers recovery when the secret cannot be decrypted', async () => {
    mockLoadWalletSecret.mockResolvedValue({
      success: false,
      error: new Error('BAD_DECRYPT')
    })
    const onMissing = jest.fn()

    const result = await ensureWalletSecret(walletId, onMissing)

    expect(result).toBe(false)
    expect(onMissing).toHaveBeenCalledTimes(1)
  })

  it.each(['NoSaltError', 'InvalidVersionError'])(
    'returns false and triggers recovery when the secret data is corrupt (%s)',
    async errorName => {
      const error = new Error('corrupt secret data')
      error.name = errorName
      mockLoadWalletSecret.mockResolvedValue({ success: false, error })
      const onMissing = jest.fn()

      const result = await ensureWalletSecret(walletId, onMissing)

      expect(result).toBe(false)
      expect(onMissing).toHaveBeenCalledTimes(1)
    }
  )

  it('throws and does NOT recover when legacy wallet data still exists (interrupted migration)', async () => {
    mockLoadWalletSecret.mockResolvedValue({
      success: false,
      error: new Error('No credentials found')
    })
    mockHasLegacyWalletData.mockResolvedValue(true)
    const onMissing = jest.fn()

    await expect(ensureWalletSecret(walletId, onMissing)).rejects.toThrow(
      'legacy wallet data exists'
    )
    expect(onMissing).not.toHaveBeenCalled()
  })

  it('rethrows and does NOT recover when the legacy probe itself fails', async () => {
    mockLoadWalletSecret.mockResolvedValue({
      success: false,
      error: new Error('No credentials found')
    })
    mockHasLegacyWalletData.mockRejectedValue(new Error('keychain unavailable'))
    const onMissing = jest.fn()

    await expect(ensureWalletSecret(walletId, onMissing)).rejects.toThrow(
      'keychain unavailable'
    )
    expect(onMissing).not.toHaveBeenCalled()
  })

  it('rethrows and does NOT recover on a transient keychain failure', async () => {
    mockLoadWalletSecret.mockResolvedValue({
      success: false,
      error: new Error('The user name or passphrase you entered is not correct')
    })
    const onMissing = jest.fn()

    await expect(ensureWalletSecret(walletId, onMissing)).rejects.toThrow(
      'The user name or passphrase you entered is not correct'
    )
    expect(onMissing).not.toHaveBeenCalled()
  })
})
