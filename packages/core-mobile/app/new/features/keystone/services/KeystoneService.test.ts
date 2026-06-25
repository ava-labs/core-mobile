import { UR } from '@ngraveio/bc-ur'

const mockParseMultiAccounts = jest.fn()

jest.mock('features/keystone/storage/KeystoneDataStorage', () => ({
  KeystoneDataStorage: { save: jest.fn() }
}))

jest.mock('@keystonehq/keystone-sdk', () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockImplementation(() => ({ parseMultiAccounts: mockParseMultiAccounts }))
}))

jest.mock('utils/bip32', () => ({
  extendedPublicKeyToXpub: jest.fn(
    (publicKey: string, chainCode: string) => `xpub(${publicKey},${chainCode})`
  )
}))

// KeystoneService is a default-exported singleton whose private walletInfo
// persists across tests. Reset modules before each test so every case starts
// from a fresh (empty walletInfo) instance, keeping the tests order-independent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let KeystoneService: any
let mockedSave: jest.Mock

describe('KeystoneService', () => {
  beforeEach(() => {
    jest.resetModules()
    KeystoneService = require('./KeystoneService').default
    mockedSave = require('features/keystone/storage/KeystoneDataStorage')
      .KeystoneDataStorage.save as jest.Mock
    mockedSave.mockClear()
    mockParseMultiAccounts.mockReset()
  })

  describe('save', () => {
    it('does not overwrite stored keystone data when walletInfo is not populated', async () => {
      // On a cold relaunch, KeystoneService.walletInfo is empty (init() only runs
      // during the onboarding QR scan). save() must NOT clobber the real stored
      // xpubs with empty strings.
      await KeystoneService.save()

      expect(mockedSave).not.toHaveBeenCalled()
    })

    it('persists walletInfo once it has been populated by init()', async () => {
      mockParseMultiAccounts.mockReturnValue({
        masterFingerprint: 'mfp123',
        keys: [
          { chain: 'ETH', publicKey: 'ethPub', chainCode: 'ethCode' },
          { chain: 'AVAX', publicKey: 'avaxPub', chainCode: 'avaxCode' }
        ]
      })

      KeystoneService.init({} as UR)
      await KeystoneService.save()

      expect(mockedSave).toHaveBeenCalledWith({
        evm: 'xpub(ethPub,ethCode)',
        xp: 'xpub(avaxPub,avaxCode)',
        mfp: 'mfp123'
      })
    })
  })
})
