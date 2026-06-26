import SecureStorageService from 'security/SecureStorageService'
import { KeystoneDataStorage } from './KeystoneDataStorage'

jest.mock('security/SecureStorageService', () => ({
  __esModule: true,
  default: {
    store: jest.fn(),
    load: jest.fn()
  },
  KeySlot: { KeystoneData: 'KeystoneData' }
}))

const mockedLoad = SecureStorageService.load as jest.Mock

describe('KeystoneDataStorage.retrieve', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // reset the module-level cache between tests
    // @ts-expect-error - private static cache, reset for test isolation
    KeystoneDataStorage.cache = undefined
  })

  it('returns stored data when all keys are present', async () => {
    mockedLoad.mockResolvedValueOnce({
      mfp: 'fp',
      xp: 'xpubXP',
      evm: 'xpubEvm'
    })

    const result = await KeystoneDataStorage.retrieve()

    expect(result).toEqual({ mfp: 'fp', xp: 'xpubXP', evm: 'xpubEvm' })
  })

  it('resolves when xp is missing so EVM signing is not blocked', async () => {
    // A Keystone wallet whose X/P xpub was never imported (e.g. account created
    // while the device was disconnected) must still load so EVM/BTC can sign.
    // X/P operations fail later via the lazy xpubXP getter, not here.
    mockedLoad.mockResolvedValueOnce({ mfp: 'fp', evm: 'xpubEvm' })

    const result = await KeystoneDataStorage.retrieve()

    expect(result).toEqual({ mfp: 'fp', evm: 'xpubEvm' })
  })

  it('still throws when the EVM xpub is missing', async () => {
    mockedLoad.mockResolvedValueOnce({ mfp: 'fp', xp: 'xpubXP' })

    await expect(KeystoneDataStorage.retrieve()).rejects.toThrow('no evm found')
  })

  it('still throws when the master fingerprint is missing', async () => {
    mockedLoad.mockResolvedValueOnce({ xp: 'xpubXP', evm: 'xpubEvm' })

    await expect(KeystoneDataStorage.retrieve()).rejects.toThrow('no mfp found')
  })
})
