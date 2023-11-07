import { ethErrors } from 'eth-rpc-errors'
import {
  UnsignedTx,
  EVMUnsignedTx,
  AVM,
  utils,
  EVM
} from '@avalabs/avalanchejs-v2'
import { Avalanche } from '@avalabs/wallets-sdk'
import { RpcMethod } from 'store/walletConnectV2/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import { selectActiveAccount } from 'store/account'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import { DEFERRED_RESULT } from '../types'
import {
  AvalancheSendTransactionRpcRequest,
  AvalancheTxParams,
  SendTransactionApproveData,
  avalancheSendTransactionHandler
} from './avalanche_sendTransaction'

jest.mock('@avalabs/avalanchejs-v2')
jest.mock('@avalabs/wallets-sdk')
jest.mock('store/settings/advanced')
jest.mock('store/account', () => {
  const actual = jest.requireActual('store/account')
  return {
    ...actual,
    selectActiveAccount: jest.fn()
  }
})
jest.mock('services/network/NetworkService')
jest.mock('services/wallet/WalletService')
jest.mock('utils/Navigation')

const mockIsDeveloperMode = true
jest.mock('store/settings/advanced', () => {
  const actual = jest.requireActual('store/settings/advanced')
  return {
    ...actual,
    selectIsDeveloperMode: () => mockIsDeveloperMode
  }
})

const utxosMock = [{ utxoId: '1' }, { utxoId: '2' }]

const createRequest = (
  params: AvalancheTxParams = { transactionHex: '0x00001', chainAlias: 'X' }
): AvalancheSendTransactionRpcRequest => {
  return {
    method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
          params
        },
        chainId: 'eip155:43114'
      }
    },
    session: mockSession
  }
}

describe('app/store/walletConnectV2/handlers/avalanche_sendTransaction/avalanche_sendTransaction.ts', () => {
  const txBytes = new Uint8Array([0, 1, 2])

  const issueTxHexMock = jest.fn()
  const getAddressesMock = jest.fn()
  const hasAllSignaturesMock = jest.fn()

  const unsignedTxJson = { foo: 'bar' }
  const unsignedTxMock = {
    addressMaps: {
      getAddresses: getAddressesMock
    },
    hasAllSignatures: hasAllSignaturesMock,
    toJSON: () => unsignedTxJson,
    getSignedTx: () => 'signedTx',
    getTx: () => ({
      foo: 'bar'
    })
  }
  const providerMock = {
    issueTxHex: issueTxHexMock
  }
  const mockDispatch = jest.fn()
  const mockListenerApi = {
    getState: jest.fn(),
    dispatch: mockDispatch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  beforeEach(() => {
    jest.resetAllMocks()
    ;(UnsignedTx.fromJSON as jest.Mock).mockReturnValue(unsignedTxMock)
    ;(EVMUnsignedTx.fromJSON as jest.Mock).mockReturnValue(unsignedTxMock)
    ;(walletService.sign as jest.Mock).mockReturnValue({ biz: 'baz' })
    ;(networkService.getAvalancheNetworkXP as jest.Mock).mockReturnValue(
      'network'
    )
    ;(walletService.getAddressesByIndices as jest.Mock).mockResolvedValue([])
    ;(networkService.getAvalancheProviderXP as jest.Mock).mockResolvedValue(
      providerMock
    )
    issueTxHexMock.mockResolvedValue({ txID: 1 })
    getAddressesMock.mockReturnValue([])
    ;(Avalanche.getVmByChainAlias as jest.Mock).mockReturnValue(AVM)
    ;(Avalanche.createAvalancheUnsignedTx as jest.Mock).mockReturnValue(
      unsignedTxMock
    )
    ;(utils.hexToBuffer as jest.Mock).mockReturnValue(txBytes)
    ;(selectActiveAccount as jest.Mock).mockReturnValue(mockAccounts[0])
    ;(Avalanche.getUtxosByTxFromGlacier as jest.Mock).mockReturnValue(utxosMock)
  })

  describe('handle', () => {
    it('returns error if transactionHex was not provided', async () => {
      const request = createRequest()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((request.data.params.request.params as any).transactionHex as any) =
        undefined

      const result = await avalancheSendTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Missing mandatory param(s)'
        })
      })
    })

    it('returns error if chainAlias was not provided', async () => {
      const request = createRequest()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((request.data.params.request.params as any).chainAlias as any) =
        undefined

      const result = await avalancheSendTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Missing mandatory param(s)'
        })
      })
    })

    it('returns error if there is no active account', async () => {
      const request = createRequest()
      ;(selectActiveAccount as jest.Mock).mockReturnValue(undefined)
      const result = await avalancheSendTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'No active account found'
        })
      })
    })

    it('returns error if fails to parse transaction', async () => {
      ;(Avalanche.parseAvalancheTx as jest.Mock).mockReturnValueOnce({
        type: 'unknown'
      })
      ;(utils.parse as jest.Mock).mockReturnValueOnce([
        undefined,
        undefined,
        new Uint8Array([0, 1, 2])
      ])

      const result = await avalancheSendTransactionHandler.handle(
        createRequest(),
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Unable to parse transaction data. Unsupported tx type'
        })
      })
    })

    it('X/P: opens the approval window and returns deferred result', async () => {
      const request = createRequest()
      const tx = { vm: AVM }

      ;(utils.unpackWithManager as jest.Mock).mockReturnValueOnce(tx)
      ;(Avalanche.parseAvalancheTx as jest.Mock).mockReturnValueOnce({
        type: 'import'
      })
      ;(utils.parse as jest.Mock).mockReturnValueOnce([
        undefined,
        undefined,
        new Uint8Array([0, 1, 2])
      ])

      const result = await avalancheSendTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(Avalanche.getUtxosByTxFromGlacier).toHaveBeenCalledWith({
        transactionHex: '0x00001',
        chainAlias: 'X',
        isTestnet: true,
        url: 'MOCK_GLACIER_URL',
        token: 'MOCK_GLACIER_API_KEY'
      })

      expect(Avalanche.createAvalancheUnsignedTx).toHaveBeenCalledWith({
        tx,
        utxos: utxosMock,
        provider: providerMock,
        fromAddressBytes: [new Uint8Array([0, 1, 2])]
      })

      expect(Navigation.navigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.AvalancheSendTransactionV2,
          params: {
            request,
            data: {
              unsignedTxJson: JSON.stringify(unsignedTxJson),
              txData: {
                type: 'import'
              },
              vm: 'AVM'
            }
          }
        }
      })
      expect(result).toEqual({
        success: true,
        value: DEFERRED_RESULT
      })
    })

    it('C: opens the approval window and returns deferred result', async () => {
      const transactionHex = '0x00001'
      const chainAlias = 'C'
      const request = createRequest({
        transactionHex,
        chainAlias
      })
      ;(Avalanche.getVmByChainAlias as jest.Mock).mockReturnValue(EVM)
      ;(utils.hexToBuffer as jest.Mock).mockReturnValueOnce(
        new Uint8Array([0, 1, 2])
      )
      ;(utils.parse as jest.Mock).mockReturnValueOnce([
        undefined,
        undefined,
        new Uint8Array([0, 1, 2])
      ])
      ;(Avalanche.parseAvalancheTx as jest.Mock).mockReturnValueOnce({
        type: 'import'
      })
      ;(
        Avalanche.createAvalancheEvmUnsignedTx as jest.Mock
      ).mockReturnValueOnce(unsignedTxMock)
      ;(utils.parse as jest.Mock).mockReturnValue([])

      const result = await avalancheSendTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(Navigation.navigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.AvalancheSendTransactionV2,
          params: {
            request,
            data: {
              unsignedTxJson: JSON.stringify(unsignedTxJson),
              txData: {
                type: 'import'
              },
              vm: 'EVM'
            }
          }
        }
      })

      expect(result).toEqual({
        success: true,
        value: DEFERRED_RESULT
      })

      expect(Avalanche.getUtxosByTxFromGlacier).toHaveBeenCalledWith({
        transactionHex: transactionHex,
        chainAlias: chainAlias,
        isTestnet: true,
        url: 'MOCK_GLACIER_URL',
        token: 'MOCK_GLACIER_API_KEY'
      })

      expect(Avalanche.createAvalancheEvmUnsignedTx).toHaveBeenCalledWith({
        txBytes: new Uint8Array([0, 1, 2]),
        vm: EVM,
        utxos: utxosMock,
        fromAddress: mockAccounts[0].addressCoreEth
      })
    })
  })

  describe('approve', () => {
    const payloadMock: {
      request: AvalancheSendTransactionRpcRequest
      data: SendTransactionApproveData
    } = {
      request: createRequest(),
      data: {
        unsignedTxJson: JSON.stringify(unsignedTxJson),
        txData: {
          type: 'import'
        } as Avalanche.ImportTx,
        vm: 'AVM'
      }
    }

    it('returns error when there are multiple addresses without indices', async () => {
      getAddressesMock.mockReturnValueOnce(['addr1', 'addr2'])
      const result = await avalancheSendTransactionHandler.approve(
        payloadMock,
        mockListenerApi
      )
      expect(result).toEqual({
        success: false,
        error: new Error(
          'Transaction contains multiple addresses, but indices were not provided'
        )
      })
    })

    it('returns error when signing fails', async () => {
      const error = new Error('some error')

      ;(walletService.sign as jest.Mock).mockRejectedValueOnce(error)

      const result = await avalancheSendTransactionHandler.approve(
        payloadMock,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error
      })
    })
    it('returns error when signatures are missing', async () => {
      hasAllSignaturesMock.mockReturnValueOnce(false)

      const result = await avalancheSendTransactionHandler.approve(
        payloadMock,
        mockListenerApi
      )
      expect(result).toEqual({
        success: false,
        error: new Error('Signing error, missing signatures.')
      })
    })

    it('sings transactions correctly on C', async () => {
      const signedTxHex = '0x000142'
      hasAllSignaturesMock.mockReturnValueOnce(true)
      ;(Avalanche.signedTxToHex as jest.Mock).mockReturnValueOnce(signedTxHex)
      const result = await avalancheSendTransactionHandler.approve(
        {
          ...payloadMock,
          data: {
            ...payloadMock.data,
            vm: 'EVM'
          }
        },
        mockListenerApi
      )
      expect(walletService.sign).toHaveBeenCalledWith(
        {
          tx: unsignedTxMock,
          externalIndices: undefined,
          internalIndices: undefined
        },
        0,
        'network'
      )
      expect(EVMUnsignedTx.fromJSON).toHaveBeenCalledWith(
        payloadMock.data.unsignedTxJson
      )
      expect(Avalanche.signedTxToHex).toHaveBeenCalledWith('signedTx')
      expect(issueTxHexMock).toHaveBeenCalledWith(signedTxHex, 'EVM')
      expect(result).toEqual({
        success: true,
        value: 1
      })
    })
    it('sings transactions correctly on X/P', async () => {
      const signedTxHex = '0x000142'
      hasAllSignaturesMock.mockReturnValueOnce(true)
      ;(Avalanche.signedTxToHex as jest.Mock).mockReturnValueOnce(signedTxHex)
      const result = await avalancheSendTransactionHandler.approve(
        payloadMock,
        mockListenerApi
      )
      expect(walletService.sign).toHaveBeenCalledWith(
        {
          tx: unsignedTxMock,
          externalIndices: undefined,
          internalIndices: undefined
        },
        0,
        'network'
      )
      expect(UnsignedTx.fromJSON).toHaveBeenCalledWith(
        payloadMock.data.unsignedTxJson
      )
      expect(Avalanche.signedTxToHex).toHaveBeenCalledWith('signedTx')
      expect(issueTxHexMock).toHaveBeenCalledWith(signedTxHex, 'AVM')
      expect(result).toEqual({
        success: true,
        value: 1
      })
    })
    it('sings transactions correctly on X/P with multiple addresses', async () => {
      const signedTxHex = '0x000142'
      hasAllSignaturesMock.mockReturnValueOnce(true)
      ;(Avalanche.signedTxToHex as jest.Mock).mockReturnValueOnce(signedTxHex)
      getAddressesMock.mockReturnValueOnce(['addr1', 'addr2'])
      const result = await avalancheSendTransactionHandler.approve(
        {
          ...payloadMock,
          request: createRequest({
            transactionHex: '0x00001',
            chainAlias: 'X',
            externalIndices: [0, 1],
            internalIndices: [2, 3]
          })
        },
        mockListenerApi
      )

      expect(walletService.sign).toHaveBeenCalledWith(
        {
          tx: unsignedTxMock,
          externalIndices: [0, 1],
          internalIndices: [2, 3]
        },
        0,
        'network'
      )
      expect(UnsignedTx.fromJSON).toHaveBeenCalledWith(
        payloadMock.data.unsignedTxJson
      )
      expect(Avalanche.signedTxToHex).toHaveBeenCalledWith('signedTx')
      expect(issueTxHexMock).toHaveBeenCalledWith(signedTxHex, 'AVM')
      expect(result).toEqual({
        success: true,
        value: 1
      })
    })
  })
})
