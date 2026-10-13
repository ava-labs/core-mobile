/* eslint-disable @typescript-eslint/no-explicit-any */
import { RpcMethod } from '@avalabs/vm-module-types'
import type { TransferStepDetails } from '@avalabs/fusion-sdk'
import { AvalancheCaip2ChainId } from '@avalabs/core-chains-sdk'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { WalletType } from 'services/wallet/types'
import { getInternalExternalAddrs } from 'common/hooks/send/utils/getInternalExternalAddrs'
import { RequestContext } from 'store/rpc/types'
import { createCctCallbacks, type CctCallbackDeps } from './createCctCallbacks'

jest.mock('services/wallet/AvalancheWalletService', () => ({
  __esModule: true,
  default: { getReadOnlySigner: jest.fn() }
}))

jest.mock('common/hooks/send/utils/getInternalExternalAddrs', () => ({
  getInternalExternalAddrs: jest.fn()
}))

jest.mock('services/wallet/utils', () => ({
  getAvaxAssetId: () => 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z'
}))

jest.mock('@avalabs/avalanchejs', () => ({
  utils: {
    getManagerForVM: jest.fn(() => ({
      getCodecFromBuffer: jest.fn(() => [{ codec: 'mock' }])
    })),
    bufferToHex: jest.fn((bytes: unknown) =>
      typeof bytes === 'string' ? bytes : '0xmock'
    ),
    UtxoSet: class {
      private readonly utxos: unknown[]
      constructor(utxos: unknown[]) {
        this.utxos = utxos
      }
      getUTXOs(): unknown[] {
        return this.utxos
      }
    }
  }
}))

const mockedGetReadOnlySigner =
  AvalancheWalletService.getReadOnlySigner as jest.Mock
const mockedGetInternalExternalAddrs = getInternalExternalAddrs as jest.Mock

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
    request: jest.fn(async () => 'mock-tx-hash') as any,
    getFilterSmallUtxos: () => false,
    ...overrides
  }
}

describe('createCctCallbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

    it('throws when addressCoreEth is empty (avoid handing the SDK an empty string)', () => {
      const { getCoreEthAddress } = createCctCallbacks(
        makeDeps({
          getActiveAccount: () => makeAccount({ addressCoreEth: '' })
        })
      )
      expect(() => getCoreEthAddress('0xabc' as any)).toThrow(
        /addressCoreEth empty/
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
    const fakeUtxo = { toBytes: () => '0xutxobytes' }
    const fakeUnsignedTx = {
      utxos: [fakeUtxo, fakeUtxo],
      getVM: () => 'AVM',
      toBytes: () => '0xtxbytes'
    } as any

    // The SDK's avalancheSendTx signature takes a TransferStepDetails as its
    // second arg (approval step context); mobile's callback ignores it, so a
    // stub satisfies the call sites.
    const fakeStep = {} as TransferStepDetails

    let mockedRequest: jest.Mock

    beforeEach(() => {
      mockedRequest = jest.fn(async () => '0xTXHASH') as jest.Mock
      mockedGetInternalExternalAddrs.mockReturnValue({
        externalIndices: [0],
        internalIndices: [1]
      })
    })

    it('dispatches AVALANCHE_SEND_TRANSACTION with the P-Chain CAIP-2 for chainAlias=P', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({ request: mockedRequest })
      )

      const txHash = await avalancheSendTx(
        {
          baseFeeInNanoAvax: 25n,
          chainAlias: 'P',
          txType: 'import',
          unsignedTx: fakeUnsignedTx
        },
        fakeStep
      )

      expect(mockedRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
          chainId: AvalancheCaip2ChainId.P,
          params: expect.objectContaining({
            chainAlias: 'P',
            externalIndices: [0],
            internalIndices: [1]
          })
        })
      )
      expect(txHash).toBe('0xTXHASH')
    })

    it('uses the X-Chain CAIP-2 for chainAlias=X', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({ request: mockedRequest })
      )

      await avalancheSendTx(
        {
          baseFeeInNanoAvax: 25n,
          chainAlias: 'X',
          txType: 'export',
          unsignedTx: fakeUnsignedTx
        },
        fakeStep
      )

      expect(mockedRequest.mock.calls[0]?.[0].chainId).toBe(
        AvalancheCaip2ChainId.X
      )
      expect(mockedRequest.mock.calls[0]?.[0].params.chainAlias).toBe('X')
    })

    it('uses the C-Chain AVAX-namespace CAIP-2 for chainAlias=C', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({ request: mockedRequest })
      )

      await avalancheSendTx(
        {
          baseFeeInNanoAvax: 25n,
          chainAlias: 'C',
          txType: 'export',
          unsignedTx: fakeUnsignedTx
        },
        fakeStep
      )

      expect(mockedRequest.mock.calls[0]?.[0].chainId).toBe(
        AvalancheCaip2ChainId.C
      )
      expect(mockedRequest.mock.calls[0]?.[0].params.chainAlias).toBe('C')
    })

    it('suppresses the tx-feedback toast on the export leg', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({ request: mockedRequest })
      )

      await avalancheSendTx(
        {
          baseFeeInNanoAvax: 25n,
          chainAlias: 'C',
          txType: 'export',
          unsignedTx: fakeUnsignedTx
        },
        fakeStep
      )

      expect(mockedRequest.mock.calls[0]?.[0].context).toEqual({
        [RequestContext.SUPPRESS_TX_FEEDBACK]: true
      })
    })

    it('lets the import leg surface its tx-feedback toast', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({ request: mockedRequest })
      )

      await avalancheSendTx(
        {
          baseFeeInNanoAvax: 25n,
          chainAlias: 'P',
          txType: 'import',
          unsignedTx: fakeUnsignedTx
        },
        fakeStep
      )

      // No SUPPRESS_TX_FEEDBACK flag so the final-leg success toast fires.
      const context = mockedRequest.mock.calls[0]?.[0].context
      expect(context).toBeUndefined()
    })

    it('uses testnet CAIP-2 when developer mode is on', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({
          getIsDeveloperMode: () => true,
          request: mockedRequest
        })
      )

      await avalancheSendTx(
        {
          baseFeeInNanoAvax: 1n,
          chainAlias: 'P',
          txType: 'import',
          unsignedTx: fakeUnsignedTx
        },
        fakeStep
      )

      expect(mockedRequest.mock.calls[0]?.[0].chainId).toBe(
        AvalancheCaip2ChainId.P_TESTNET
      )
    })

    it('throws when xpAddressDictionary is empty (would otherwise produce invalid signing indices)', async () => {
      const { avalancheSendTx } = createCctCallbacks(
        makeDeps({
          getXpAddresses: async () => ({
            xpAddresses: ['fuji1aaa'],
            xpAddressDictionary: {} as any
          }),
          request: mockedRequest
        })
      )
      await expect(
        avalancheSendTx(
          {
            baseFeeInNanoAvax: 1n,
            chainAlias: 'P',
            txType: 'import',
            unsignedTx: fakeUnsignedTx
          },
          fakeStep
        )
      ).rejects.toThrow(/xpAddressDictionary empty/)
      expect(mockedRequest).not.toHaveBeenCalled()
    })
  })

  describe('getUtxos small-UTXO filtering (CP-13903)', () => {
    const avaxAssetId = 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z'
    const mockUtxo = (assetId: string, amount: bigint) =>
      ({
        getAssetId: () => assetId,
        output: { amount: () => amount }
      } as never)

    const dust = mockUtxo(avaxAssetId, 1_000n)
    const big = mockUtxo(avaxAssetId, 5_000_000n)

    const signer = {
      getAtomicUTXOs: jest.fn(),
      getUTXOs: jest.fn(),
      getAddresses: jest.fn(),
      getChangeAddress: jest.fn()
    }

    const originalUtxoSet = {
      getUTXOs: () => [dust, big]
    }

    beforeEach(() => {
      mockedGetReadOnlySigner.mockResolvedValue(signer)
      signer.getUTXOs.mockResolvedValue(originalUtxoSet)
    })

    it('passes the original UtxoSet through untouched when the setting is off', async () => {
      const { getUtxos } = createCctCallbacks(
        makeDeps({
          getFilterSmallUtxos: () => false
        })
      )
      const result = await getUtxos('P')
      // Reference identity: the SDK must receive the signer's own UtxoSet,
      // not a rewrapped copy, when filtering is off.
      expect(result).toBe(originalUtxoSet)
      expect(result.getUTXOs()).toHaveLength(2)
    })

    it('drops dust UTXOs when the setting is on', async () => {
      const { getUtxos } = createCctCallbacks(
        makeDeps({
          getFilterSmallUtxos: () => true
        })
      )
      const result = await getUtxos('P')
      expect(result.getUTXOs()).toEqual([big])
    })
  })
})
