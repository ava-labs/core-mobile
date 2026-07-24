import BiometricsSDK from 'utils/BiometricsSDK'
import { ensureWalletSecret } from './ensureWalletSecret'

jest.mock('utils/BiometricsSDK', () => ({
  __esModule: true,
  default: { loadWalletSecret: jest.fn() }
}))
jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() }
}))

const mockLoadWalletSecret = BiometricsSDK.loadWalletSecret as jest.Mock

describe('ensureWalletSecret', () => {
  const walletId = 'wallet-1'

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
