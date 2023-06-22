import { ethErrors } from 'eth-rpc-errors'
import {
  UnsignedTx,
  AVM,
  utils,
  Credential,
  avaxSerial
} from '@avalabs/avalanchejs-v2'
import { Avalanche } from '@avalabs/wallets-sdk'
import { RpcMethod } from 'store/walletConnectV2/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import { selectActiveAccount } from 'store/account'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import mockAccounts from 'tests/fixtures/accounts.json'
import { DEFERRED_RESULT } from '../types'
import {
  AvalancheSignTransactionApproveData,
  AvalancheSignTransactionRpcRequest,
  AvalancheTxParams,
  avalancheSignTransactionHandler
} from './avalanche_signTransaction'

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

const createRequest = (
  params: AvalancheTxParams = { transactionHex: '0x00001', chainAlias: 'X' }
): AvalancheSignTransactionRpcRequest => {
  return {
    method: RpcMethod.AVALANCHE_SIGN_TRANSACTION,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: RpcMethod.AVALANCHE_SIGN_TRANSACTION,
          params
        },
        chainId: 'eip155:43114'
      }
    },
    session: mockSession
  }
}

describe('app/store/walletConnectV2/handlers/avalanche_signTransaction/avalanche_signTransaction', () => {
  const txBytes = new Uint8Array([0, 1, 2])

  const issueTxHexMock = jest.fn()

  const txMock = {
    getSigIndices: jest.fn()
  }

  const signerAddressBytesMock = new Uint8Array([3, 4, 5])
  const signerAddressMock = { foo: 'bar' }
  const unsignedTxJson = { biz: 'baz' }
  const unsignedTxMock = {
    getSigIndicesForAddress: jest.fn(),
    getSigIndices: jest.fn(),
    toJSON: jest.fn(),
    getInputUtxos: jest.fn(),
    getTx: () => ({
      foo: 'bar'
    })
  }
  const codecManagerMock = {
    unpack: jest.fn()
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
    ;(Avalanche.getVmByChainAlias as jest.Mock).mockReturnValue(AVM)
    ;(utils.hexToBuffer as jest.Mock).mockReturnValue(txBytes)
    ;(utils.unpackWithManager as jest.Mock).mockReturnValue(txMock)
    ;(utils.addressesFromBytes as jest.Mock).mockReturnValue([
      signerAddressMock
    ])
    ;(utils.parse as jest.Mock).mockReturnValue([
      undefined,
      undefined,
      signerAddressBytesMock
    ])
    ;(utils.getManagerForVM as jest.Mock).mockReturnValue(codecManagerMock)
    txMock.getSigIndices.mockReturnValue([])
    unsignedTxMock.toJSON.mockReturnValue(unsignedTxJson)
    ;(selectActiveAccount as jest.Mock).mockReturnValue(mockAccounts[0])
    ;(networkService.getAvalancheProviderXP as jest.Mock).mockReturnValue(
      providerMock
    )
    ;(networkService.getAvalancheNetworkXP as jest.Mock).mockReturnValue(
      'network'
    )
  })

  describe('handle', () => {
    it('returns error if transactionHex was not provided', async () => {
      const request = createRequest()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(request.data.params.request.params.transactionHex as any) = undefined

      const result = await avalancheSignTransactionHandler.handle(
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
      ;(request.data.params.request.params.chainAlias as any) = undefined

      const result = await avalancheSignTransactionHandler.handle(
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

      const result = await avalancheSignTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'No active account found'
        })
      })

      expect(Avalanche.getVmByChainAlias).toHaveBeenCalledWith('X')
      expect(utils.hexToBuffer).toHaveBeenCalledWith('0x00001')
    })

    it('returns error if signer address is missing', async () => {
      const request = createRequest()
      ;(utils.addressesFromBytes as jest.Mock).mockReturnValue([])

      const result = await avalancheSignTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'Missing signer address'
        })
      })

      expect(Avalanche.getVmByChainAlias).toHaveBeenCalledWith('X')
      expect(utils.hexToBuffer).toHaveBeenCalledWith('0x00001')
      expect(Avalanche.createAvalancheUnsignedTx).toHaveBeenCalledWith({
        tx: txMock,
        vm: AVM,
        provider: providerMock,
        credentials: [],
        utxos: undefined
      })
      expect(utils.addressesFromBytes).toHaveBeenCalledWith([
        signerAddressBytesMock
      ])
    })

    it('returns error if there are no signature indices for the account', async () => {
      const request = createRequest()

      unsignedTxMock.getSigIndicesForAddress.mockReturnValue(undefined)
      ;(Avalanche.createAvalancheUnsignedTx as jest.Mock).mockReturnValue(
        unsignedTxMock
      )

      const result = await avalancheSignTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'This account has nothing to sign'
        })
      })

      expect(Avalanche.createAvalancheUnsignedTx).toHaveBeenCalledWith({
        tx: txMock,
        vm: AVM,
        provider: providerMock,
        credentials: [],
        utxos: undefined
      })
      expect(utils.addressesFromBytes).toHaveBeenCalledWith([
        signerAddressBytesMock
      ])
      expect(utils.parse).toHaveBeenCalledWith(mockAccounts[0].addressAVM)
      expect(unsignedTxMock.getSigIndicesForAddress).toHaveBeenCalledWith(
        signerAddressMock
      )
    })

    it('returns error if there are no valid signature indices for the account', async () => {
      const request = createRequest()

      unsignedTxMock.getSigIndicesForAddress.mockReturnValueOnce([])
      unsignedTxMock.getSigIndices.mockReturnValueOnce([])
      ;(Avalanche.createAvalancheUnsignedTx as jest.Mock).mockReturnValue(
        unsignedTxMock
      )

      const result = await avalancheSignTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'This account has nothing to sign'
        })
      })

      expect(Avalanche.createAvalancheUnsignedTx).toHaveBeenCalledWith({
        tx: txMock,
        vm: AVM,
        provider: providerMock,
        credentials: [],
        utxos: undefined
      })
      expect(utils.addressesFromBytes).toHaveBeenCalledWith([
        signerAddressBytesMock
      ])
      expect(utils.parse).toHaveBeenCalledWith(mockAccounts[0].addressAVM)
      expect(unsignedTxMock.getSigIndicesForAddress).toHaveBeenCalledWith(
        signerAddressMock
      )
      expect(unsignedTxMock.getSigIndices).toHaveBeenCalled()
    })

    it('returns error if it fails to parse the transaction', async () => {
      const request = createRequest()

      unsignedTxMock.getSigIndicesForAddress.mockReturnValueOnce([[0, 1]])
      unsignedTxMock.getSigIndices.mockReturnValueOnce([[1, 2]])
      ;(Avalanche.createAvalancheUnsignedTx as jest.Mock).mockReturnValue(
        unsignedTxMock
      )
      ;(Avalanche.parseAvalancheTx as jest.Mock).mockReturnValueOnce({
        type: 'unknown'
      })
      const result = await avalancheSignTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'Unable to parse transaction data. Unsupported tx type'
        })
      })

      expect(utils.addressesFromBytes).toHaveBeenCalledWith([
        signerAddressBytesMock
      ])
      expect(unsignedTxMock.getSigIndicesForAddress).toHaveBeenCalledWith(
        signerAddressMock
      )
      expect(unsignedTxMock.getSigIndices).toHaveBeenCalled()
      expect(Avalanche.parseAvalancheTx).toHaveBeenCalledWith(
        {
          foo: 'bar'
        },
        providerMock,
        mockAccounts[0].addressAVM
      )
    })

    it('unsigned: opens the approval dialog and returns deferred result', async () => {
      const request = createRequest()

      txMock.getSigIndices.mockReturnValueOnce([
        [0, 1],
        [1, 1]
      ])
      codecManagerMock.unpack.mockReturnValueOnce(new Error('some error'))
      unsignedTxMock.getSigIndicesForAddress.mockReturnValueOnce([[0, 1]])
      unsignedTxMock.getSigIndices.mockReturnValueOnce([[1, 2]])
      ;(Avalanche.createAvalancheUnsignedTx as jest.Mock).mockReturnValue(
        unsignedTxMock
      )
      ;(Avalanche.parseAvalancheTx as jest.Mock).mockReturnValueOnce({
        type: 'import'
      })

      const result = await avalancheSignTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: true,
        value: DEFERRED_RESULT
      })

      expect(Avalanche.createAvalancheUnsignedTx).toHaveBeenCalledTimes(1)
      expect(Avalanche.createAvalancheUnsignedTx).toHaveBeenCalledWith({
        tx: txMock,
        vm: AVM,
        provider: providerMock,
        credentials: [
          (Credential as unknown as jest.Mock).mock.instances[0],
          (Credential as unknown as jest.Mock).mock.instances[1]
        ],
        utxos: undefined
      })

      expect(Navigation.navigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.AvalancheSignTransactionV2,
          params: {
            request,
            data: {
              unsignedTxJson: JSON.stringify(unsignedTxJson),
              txData: {
                type: 'import'
              },
              vm: 'AVM',
              ownSignatureIndices: [[0, 1]]
            }
          }
        }
      })
    })

    it('signed: opens the approval dialog and returns deferred result', async () => {
      const signedTxMock = {
        getCredentials: () =>
          [{ biz: 'baz' }, { baz: 'biz' }] as unknown as Credential[]
      }

      const signaturesMock = [
        [{ _type: 'signature' }],
        [{ _type: 'signature' }, { _type: 'signature' }]
      ]

      const utxosMock = [
        { utxoID: { txID: '0x1' } },
        { utxoID: { txID: '0x2' } }
      ]

      const request = createRequest()

      txMock.getSigIndices.mockReturnValueOnce([
        [0, 1],
        [1, 1]
      ])
      codecManagerMock.unpack.mockReturnValueOnce(signedTxMock)
      unsignedTxMock.getInputUtxos.mockReturnValueOnce(utxosMock)
      unsignedTxMock.getSigIndicesForAddress.mockReturnValueOnce([[0, 1]])
      unsignedTxMock.getSigIndices.mockReturnValueOnce([
        [1, 2],
        [1, 0]
      ])
      ;(Avalanche.createAvalancheUnsignedTx as jest.Mock).mockReturnValue(
        unsignedTxMock
      )
      ;(Avalanche.parseAvalancheTx as jest.Mock).mockReturnValueOnce({
        type: 'import'
      })
      ;(Avalanche.populateCredential as jest.Mock)
        .mockReturnValueOnce(signaturesMock[0])
        .mockReturnValueOnce(signaturesMock[1])

      const result = await avalancheSignTransactionHandler.handle(
        request,
        mockListenerApi
      )

      expect(result).toEqual({
        success: true,
        value: DEFERRED_RESULT
      })

      expect(Credential).toHaveBeenCalledTimes(2)
      expect(Credential).toHaveBeenNthCalledWith(1, signaturesMock[0])
      expect(Credential).toHaveBeenNthCalledWith(2, signaturesMock[1])

      expect(Avalanche.populateCredential).toHaveBeenCalledTimes(2)
      expect(Avalanche.populateCredential).toHaveBeenNthCalledWith(1, [0, 1], {
        unsignedTx: unsignedTxMock,
        credentialIndex: 0
      })
      expect(Avalanche.populateCredential).toHaveBeenNthCalledWith(2, [1, 1], {
        unsignedTx: unsignedTxMock,
        credentialIndex: 1
      })

      expect(Avalanche.createAvalancheUnsignedTx).toHaveBeenCalledTimes(2)
      expect(Avalanche.createAvalancheUnsignedTx).toHaveBeenNthCalledWith(1, {
        tx: txMock,
        vm: AVM,
        provider: providerMock,
        credentials: [{ biz: 'baz' }, { baz: 'biz' }]
      })
      expect(Avalanche.createAvalancheUnsignedTx).toHaveBeenNthCalledWith(2, {
        tx: txMock,
        vm: AVM,
        provider: providerMock,
        credentials: [
          (Credential as unknown as jest.Mock).mock.instances[0],
          (Credential as unknown as jest.Mock).mock.instances[1]
        ],
        utxos: utxosMock
      })
      expect(utils.addressesFromBytes).toHaveBeenCalledWith([
        signerAddressBytesMock
      ])
      expect(utils.parse).toHaveBeenCalledWith(mockAccounts[0].addressAVM)
      expect(unsignedTxMock.getSigIndicesForAddress).toHaveBeenCalledWith(
        signerAddressMock
      )
      expect(unsignedTxMock.getSigIndices).toHaveBeenCalled()
      expect(Avalanche.parseAvalancheTx).toHaveBeenCalledWith(
        {
          foo: 'bar'
        },
        providerMock,
        mockAccounts[0].addressAVM
      )

      expect(Navigation.navigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.AvalancheSignTransactionV2,
          params: {
            request,
            data: {
              unsignedTxJson: JSON.stringify(unsignedTxJson),
              txData: {
                type: 'import'
              },
              vm: 'AVM',
              ownSignatureIndices: [[0, 1]]
            }
          }
        }
      })
    })
  })

  describe('approve', () => {
    const payloadMock: {
      request: AvalancheSignTransactionRpcRequest
      data: AvalancheSignTransactionApproveData
    } = {
      request: createRequest(),
      data: {
        unsignedTxJson: JSON.stringify(unsignedTxJson),
        txData: {
          type: 'import'
        } as Avalanche.ImportTx,
        vm: 'AVM',
        ownSignatureIndices: [[0, 2]]
      }
    }
    const signedTransactionJsonMock = { signed: true }
    const signedTxMock = {
      getSigIndices: jest.fn(),
      getCredentials: jest.fn(),
      getTx: jest.fn()
    }
    const signedTxInstanceMock = jest.fn()

    beforeEach(() => {
      signedTxMock.getCredentials.mockReturnValue([
        {
          toJSON: () => [
            {
              sig: '0x3463463645',
              toString: () => '0x3463463645' // other owner's
            },
            {
              sig: '0x0',
              toString: () => '0x0' // placeholder to fill the gap
            },
            {
              sig: '0x1231241242',
              toString: () => '0x1231241242' // our signature
            }
          ]
        }
      ])
      signedTxMock.getTx.mockReturnValue(txMock)
      ;(avaxSerial.SignedTx as unknown as jest.Mock) = signedTxInstanceMock
    })

    const signedTransactionHex = '0x9999999'
    it('returns error if no active account', async () => {
      ;(selectActiveAccount as jest.Mock).mockReturnValue(undefined)

      const result = await avalancheSignTransactionHandler.approve(
        payloadMock,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: new Error('Unable to submit transaction, no active account.')
      })
    })

    it('returns error if own signatures are missing', async () => {
      ;(UnsignedTx.fromJSON as jest.Mock)
        .mockReturnValueOnce(unsignedTxMock)
        .mockReturnValue(signedTxMock)
      unsignedTxMock.getSigIndices.mockReturnValue([[0, 3]])
      ;(walletService.sign as jest.Mock).mockReturnValueOnce(
        signedTransactionJsonMock
      )
      ;(Avalanche.signedTxToHex as jest.Mock).mockReturnValueOnce(
        signedTransactionHex
      )

      const result = await avalancheSignTransactionHandler.approve(
        payloadMock,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: new Error('Failed to sign [0, 3]')
      })
    })

    it('returns error if own signatures are empty', async () => {
      ;(UnsignedTx.fromJSON as jest.Mock)
        .mockReturnValueOnce(unsignedTxMock)
        .mockReturnValue(signedTxMock)
      signedTxMock.getCredentials.mockReturnValueOnce([
        {
          toJSON: () => [
            {
              sig: '0x3463463645',
              toString: () => '0x3463463645' // other owner's
            },
            {
              sig: '0x0',
              toString: () => '0x0' // placeholder to fill the gap
            },
            {
              sig: '0x0',
              toString: () => '0x0' // our empty signature
            }
          ]
        }
      ])
      signedTxMock.getSigIndices.mockReturnValue([])
      unsignedTxMock.getSigIndices.mockReturnValue([[0, 2]])
      ;(utils.bufferToHex as jest.Mock).mockReturnValueOnce('0x0')
      ;(walletService.sign as jest.Mock).mockReturnValueOnce(
        signedTransactionJsonMock
      )
      ;(Avalanche.signedTxToHex as jest.Mock).mockReturnValueOnce(
        signedTransactionHex
      )

      const result = await avalancheSignTransactionHandler.approve(
        payloadMock,
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: new Error('Failed to sign [0, 2]')
      })
    })
    it('returns the correct (partially) signed transaction details', async () => {
      ;(UnsignedTx.fromJSON as jest.Mock)
        .mockReturnValueOnce(unsignedTxMock)
        .mockReturnValue(signedTxMock)
      unsignedTxMock.getSigIndices.mockReturnValue([[0, 2]])
      ;(walletService.sign as jest.Mock).mockReturnValueOnce(
        signedTransactionJsonMock
      )
      ;(Avalanche.signedTxToHex as jest.Mock).mockReturnValueOnce(
        signedTransactionHex
      )

      const result = await avalancheSignTransactionHandler.approve(
        payloadMock,
        mockListenerApi
      )

      expect(result).toEqual({
        success: true,
        value: {
          signedTransactionHex,
          signatures: [
            {
              signature: '0x1231241242',
              sigIndices: [0, 2]
            }
          ]
        }
      })
      expect(UnsignedTx.fromJSON).toHaveBeenCalledTimes(2)
      expect(UnsignedTx.fromJSON).toHaveBeenNthCalledWith(
        1,
        JSON.stringify(unsignedTxJson)
      )
      expect(UnsignedTx.fromJSON).toHaveBeenNthCalledWith(
        2,
        signedTransactionJsonMock
      )
      expect(walletService.sign).toHaveBeenCalledWith(
        {
          tx: unsignedTxMock
        },
        0,
        'network'
      )
      expect(signedTxMock.getCredentials).toHaveBeenCalled()
      expect(unsignedTxMock.getSigIndices).toHaveBeenCalled()
      expect(Credential).toHaveBeenCalledWith([
        expect.objectContaining({
          sig: '0x3463463645'
        }),
        expect.objectContaining({
          sig: '0x1231241242'
        })
      ])
      expect(avaxSerial.SignedTx).toHaveBeenCalledWith(txMock, [
        (Credential as unknown as jest.Mock).mock.instances[0]
      ])
    })
  })
})
