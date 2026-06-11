/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnsignedTx } from '@avalabs/avalanchejs'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { getInternalExternalAddrs } from 'common/hooks/send/utils/getInternalExternalAddrs'
import { createCctCallbacks, type CctCallbackDeps } from './createCctCallbacks'

jest.mock('services/wallet/AvalancheWalletService', () => ({
  __esModule: true,
  default: { getReadOnlySigner: jest.fn() }
}))

jest.mock('services/network/NetworkService', () => ({
  __esModule: true,
  default: {
    getAvalancheNetworkP: jest.fn(),
    getAvalancheNetworkX: jest.fn(),
    sendTransaction: jest.fn()
  }
}))

jest.mock('services/wallet/WalletService', () => ({
  __esModule: true,
  default: { sign: jest.fn() }
}))

jest.mock('common/hooks/send/utils/getInternalExternalAddrs', () => ({
  getInternalExternalAddrs: jest.fn()
}))

jest.mock('@avalabs/avalanchejs', () => ({
  UnsignedTx: { fromJSON: jest.fn() }
}))

const P_NETWORK = { name: 'P-network' }
const X_NETWORK = { name: 'X-network' }

const mockedGetReadOnlySigner =
  AvalancheWalletService.getReadOnlySigner as jest.Mock
const mockedGetAvalancheNetworkP =
  NetworkService.getAvalancheNetworkP as jest.Mock
const mockedGetAvalancheNetworkX =
  NetworkService.getAvalancheNetworkX as jest.Mock
const mockedSendTransaction = NetworkService.sendTransaction as jest.Mock
const mockedWalletSign = WalletService.sign as jest.Mock
const mockedGetInternalExternalAddrs = getInternalExternalAddrs as jest.Mock
const mockedUnsignedTxFromJSON = UnsignedTx.fromJSON as jest.Mock

const makeAccount = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'account-1',
    index: 0,
    walletId: 'wallet-1',
    addressC: '0xcaddress',
    addressCoreEth: 'C-fuji1xxx',
    addressPVM: 'P-fuji1xxx',
    addressAVM: 'X-fuji1xxx',
    ...overrides
  } as any)

const makeDeps = (
  overrides: Partial<CctCallbackDeps> = {}
): CctCallbackDeps => {
  const account = makeAccount()
  return {
    getActiveAccount: () => account,
    getIsDeveloperMode: () => false,
    getWallet: () => ({ id: account.walletId, type: WalletType.MNEMONIC }),
    getXpAddresses: async () => ({
      xpAddresses: ['fuji1aaa', 'fuji1bbb'],
      xpAddressDictionary: {
        fuji1aaa: { space: 'e', index: 0 },
        fuji1bbb: { space: 'i', index: 0 }
      } as any
    }),
    ...overrides
  }
}

describe('createCctCallbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetAvalancheNetworkP.mockReturnValue(P_NETWORK)
    mockedGetAvalancheNetworkX.mockReturnValue(X_NETWORK)
  })

  describe('getCoreEthAddress', () => {
    it('returns the active account Coreth bech32 address', () => {
      const { getCoreEthAddress } = createCctCallbacks(makeDeps())
      expect(getCoreEthAddress('0xabc' as any)).toBe('C-fuji1xxx')
    })

    it('throws when no active account', () => {
      const { getCoreEthAddress } = createCctCallbacks(
        makeDeps({ getActiveAccount: () => undefined })
      )
      expect(() => getCoreEthAddress('0xabc' as any)).toThrow(
        /no active account/
      )
    })
  })

  describe('UTXO and address callbacks', () => {
    const signer = {
      getAtomicUTXOs: jest.fn(),
      getUTXOs: jest.fn(),
      getAddresses: jest.fn(),
      getChangeAddress: jest.fn()
    }

    beforeEach(() => {
      mockedGetReadOnlySigner.mockResolvedValue(signer)
      signer.getAtomicUTXOs.mockResolvedValue('atomic-utxos')
      signer.getUTXOs.mockResolvedValue('utxos')
      signer.getAddresses.mockReturnValue(['P-fuji1xxx', 'P-fuji1yyy'])
      signer.getChangeAddress.mockReturnValue('P-fuji1change')
    })

    it('getAtomicUtxos delegates to signer.getAtomicUTXOs(dst, src)', async () => {
      const { getAtomicUtxos } = createCctCallbacks(makeDeps())
      const result = await getAtomicUtxos('P', 'C')
      expect(signer.getAtomicUTXOs).toHaveBeenCalledWith('P', 'C')
      expect(result).toBe('atomic-utxos')
    })

    it('getUtxos delegates to signer.getUTXOs(chainAlias)', async () => {
      const { getUtxos } = createCctCallbacks(makeDeps())
      const result = await getUtxos('P')
      expect(signer.getUTXOs).toHaveBeenCalledWith('P')
      expect(result).toBe('utxos')
    })

    it('getWalletAddressesForChainAlias delegates to signer.getAddresses', async () => {
      const { getWalletAddressesForChainAlias } = createCctCallbacks(makeDeps())
      const result = await getWalletAddressesForChainAlias('P')
      expect(signer.getAddresses).toHaveBeenCalledWith('P')
      expect(result).toEqual(['P-fuji1xxx', 'P-fuji1yyy'])
    })

    it('getWalletChangeAddressForChainAlias delegates to signer.getChangeAddress', async () => {
      const { getWalletChangeAddressForChainAlias } = createCctCallbacks(
        makeDeps()
      )
      const result = await getWalletChangeAddressForChainAlias('P')
      expect(signer.getChangeAddress).toHaveBeenCalledWith('P')
      expect(result).toBe('P-fuji1change')
    })

    it('reads the latest account on every call (live state)', async () => {
      let account = makeAccount({ id: 'account-1' })
      const { getAtomicUtxos } = createCctCallbacks(
        makeDeps({ getActiveAccount: () => account })
      )
      await getAtomicUtxos('P', 'C')
      account = makeAccount({ id: 'account-2' })
      await getAtomicUtxos('P', 'C')

      expect(mockedGetReadOnlySigner).toHaveBeenCalledTimes(2)
      expect(mockedGetReadOnlySigner.mock.calls[0]?.[0].account.id).toBe(
        'account-1'
      )
      expect(mockedGetReadOnlySigner.mock.calls[1]?.[0].account.id).toBe(
        'account-2'
      )
    })

    it('throws when no active account', async () => {
      const { getAtomicUtxos } = createCctCallbacks(
        makeDeps({ getActiveAccount: () => undefined })
      )
      await expect(getAtomicUtxos('P', 'C')).rejects.toThrow(
        /no active account/
      )
    })

    it('throws when xpAddresses is empty (refuses to build a signer with no XP addresses)', async () => {
      const { getAtomicUtxos } = createCctCallbacks(
        makeDeps({
          getXpAddresses: async () => ({
            xpAddresses: [],
            xpAddressDictionary: {
              fuji1aaa: { space: 'e', index: 0 }
            } as any
          })
        })
      )
      await expect(getAtomicUtxos('P', 'C')).rejects.toThrow(
        /xpAddresses empty/
      )
    })
  })

  describe('avalancheSendTx', () => {
    const fakeSignedTx = { signedTx: 'bytes' }
    const fakeUnsignedTx = { utxos: ['utxo-a', 'utxo-b'] } as any

    beforeEach(() => {
      mockedWalletSign.mockResolvedValue('{"signed":"json"}')
      mockedUnsignedTxFromJSON.mockReturnValue({
        getSignedTx: () => fakeSignedTx
      })
      mockedSendTransaction.mockResolvedValue('0xTXHASH')
      mockedGetInternalExternalAddrs.mockReturnValue({
        externalIndices: [0],
        internalIndices: [1]
      })
    })

    it('signs and broadcasts via the P network for chainAlias=P', async () => {
      const { avalancheSendTx } = createCctCallbacks(makeDeps())

      const txHash = await avalancheSendTx({
        baseFeeInNanoAvax: 25n,
        chainAlias: 'P',
        txType: 'import',
        unsignedTx: fakeUnsignedTx
      })

      expect(mockedGetAvalancheNetworkP).toHaveBeenCalledWith(false)
      expect(mockedGetAvalancheNetworkX).not.toHaveBeenCalled()

      expect(mockedWalletSign).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'wallet-1',
          walletType: WalletType.MNEMONIC,
          accountIndex: 0,
          network: P_NETWORK,
          transaction: expect.objectContaining({
            tx: fakeUnsignedTx,
            externalIndices: [0],
            internalIndices: [1]
          })
        })
      )

      expect(mockedSendTransaction).toHaveBeenCalledWith({
        signedTx: fakeSignedTx,
        network: P_NETWORK
      })
      expect(txHash).toBe('0xTXHASH')
    })

    it('uses the X network for chainAlias=X', async () => {
      const { avalancheSendTx } = createCctCallbacks(makeDeps())

      await avalancheSendTx({
        baseFeeInNanoAvax: 25n,
        chainAlias: 'X',
        txType: 'export',
        unsignedTx: fakeUnsignedTx
      })

      expect(mockedGetAvalancheNetworkX).toHaveBeenCalledWith(false)
      expect(mockedWalletSign.mock.calls[0]?.[0].network).toBe(X_NETWORK)
      expect(mockedSendTransaction.mock.calls[0]?.[0].network).toBe(X_NETWORK)
    })

    it('uses the P network for chainAlias=C (atomic gateway is on the XP RPC)', async () => {
      const { avalancheSendTx } = createCctCallbacks(makeDeps())

      await avalancheSendTx({
        baseFeeInNanoAvax: 25n,
        chainAlias: 'C',
        txType: 'export',
        unsignedTx: fakeUnsignedTx
      })

      expect(mockedGetAvalancheNetworkP).toHaveBeenCalledWith(false)
      expect(mockedGetAvalancheNetworkX).not.toHaveBeenCalled()
    })

    it('passes isTestnet through to the network selector', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({ getIsDeveloperMode: () => true })
      )

      await avalancheSendTx({
        baseFeeInNanoAvax: 1n,
        chainAlias: 'P',
        txType: 'import',
        unsignedTx: fakeUnsignedTx
      })

      expect(mockedGetAvalancheNetworkP).toHaveBeenCalledWith(true)
    })

    it('throws when no active wallet', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({ getWallet: () => undefined })
      )
      await expect(
        avalancheSendTx({
          baseFeeInNanoAvax: 1n,
          chainAlias: 'P',
          txType: 'import',
          unsignedTx: fakeUnsignedTx
        })
      ).rejects.toThrow(/no active wallet/)
    })

    it('throws when no active account', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({ getActiveAccount: () => undefined })
      )
      await expect(
        avalancheSendTx({
          baseFeeInNanoAvax: 1n,
          chainAlias: 'P',
          txType: 'import',
          unsignedTx: fakeUnsignedTx
        })
      ).rejects.toThrow(/no active account/)
    })

    it('throws when xpAddressDictionary is empty (would otherwise produce invalid signing indices)', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({
          getXpAddresses: async () => ({
            xpAddresses: ['fuji1aaa'],
            xpAddressDictionary: {} as any
          })
        })
      )
      await expect(
        avalancheSendTx({
          baseFeeInNanoAvax: 1n,
          chainAlias: 'P',
          txType: 'import',
          unsignedTx: fakeUnsignedTx
        })
      ).rejects.toThrow(/xpAddressDictionary empty/)
      expect(mockedWalletSign).not.toHaveBeenCalled()
    })
  })
})
