import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod } from 'store/walletConnectV2'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import mockNetworks from 'tests/fixtures/networks.json'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import * as Sentry from '@sentry/react-native'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { prefetchNetworkFee } from 'hooks/useNetworkFee'
import { selectNetwork } from 'store/network'
import { updateRequestStatus } from '../../slice'
import { ethSendTransactionHandler as handler } from './eth_sendTransaction'

const mockTransactionCount = 20
jest.mock('services/network/utils/providerUtils', () => {
  const actual = jest.requireActual('services/network/utils/providerUtils')
  return {
    ...actual,
    getEvmProvider: () => ({
      getTransactionCount: () => mockTransactionCount
    })
  }
})

const mockSign = jest.fn()
jest.spyOn(WalletService, 'sign').mockImplementation(mockSign)

const mockSendTransaction = jest.fn()
jest
  .spyOn(NetworkService, 'sendTransaction')
  .mockImplementation(mockSendTransaction)

jest.mock('hooks/useNetworkFee', () => {
  const actual = jest.requireActual('hooks/useNetworkFee')
  return {
    ...actual,
    prefetchNetworkFee: jest.fn()
  }
})

const mockNetwork = mockNetworks[43114]
jest.mock('store/network', () => {
  const actual = jest.requireActual('store/network')
  return {
    ...actual,
    selectNetwork: jest.fn()
  }
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSelectNetwork = selectNetwork as jest.MockedFunction<any>
mockSelectNetwork.mockImplementation(() => () => mockNetwork)

const mockSelectAccountByAddress = jest.fn()
const mockAccount = mockAccounts[0]
jest.mock('store/account', () => {
  const actual = jest.requireActual('store/account')
  return {
    ...actual,
    selectAccountByAddress: () => mockSelectAccountByAddress
  }
})
mockSelectAccountByAddress.mockImplementation(() => mockAccount)

const mockCaptureException = jest.fn()
jest.spyOn(Sentry, 'captureException').mockImplementation(mockCaptureException)

const mockNavigate = jest.fn()
jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod = 'eth_sendTransaction' as RpcMethod.ETH_SEND_TRANSACTION

const testParams = [
  {
    from: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
    to: '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
    data: '0x10000',
    value: '0x10000',
    gas: '0x100',
    gasPrice: '0x10'
  }
]

const testData = {
  txParams: {
    from: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
    to: '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
    data: '0x10000',
    value: '0x10000',
    gas: '0x100',
    gasPrice: '0x10'
  }
}

const createRequest = (params: unknown) => {
  return {
    method: testMethod,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: testMethod,
          params
        },
        chainId: 'eip155:43113'
      }
    },
    session: mockSession
  }
}

const testHandleInvalidParams = async (params: unknown) => {
  const testRequest = createRequest(params)

  const result = await handler.handle(testRequest, mockListenerApi)

  expect(result).toEqual({
    success: false,
    error: ethErrors.rpc.invalidParams({
      message: 'Transaction params are invalid'
    })
  })
}

const testApproveInvalidData = async (data: unknown) => {
  const testRequest = createRequest(testParams)

  const result = await handler.approve(
    { request: testRequest, data },
    mockListenerApi
  )

  expect(result).toEqual({
    success: false,
    error: ethErrors.rpc.internal('Invalid approve data')
  })
}

describe('eth_sendTransaction handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['eth_sendTransaction'])
  })

  describe('handle', () => {
    it('should return error when params are invalid', async () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        [
          {
            from: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
          }
        ],
        [
          {
            gas: '0x100'
          }
        ]
      ]

      for (const scenario of invalidParamsScenarios) {
        await testHandleInvalidParams(scenario)
      }
    })

    it('should fetch network fee, display prompt and return success', async () => {
      const testRequest = createRequest(testParams)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(mockSelectNetwork).toHaveBeenCalledWith(
        Number(testRequest.data.params.chainId.split(':')[1])
      )

      expect(prefetchNetworkFee).toHaveBeenCalledWith(mockNetwork)

      expect(mockNavigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.SignTransactionV2,
          params: {
            request: testRequest,
            transaction: testParams[0]
          }
        }
      })

      expect(result).toEqual({ success: true, value: expect.any(Symbol) })
    })
  })

  describe('approve', () => {
    it('should return error when approve data is invalid', async () => {
      const invalidDataScenarios = [
        null,
        {},
        {
          txParams: {
            from: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
          }
        }
      ]

      for (const scenario of invalidDataScenarios) {
        await testApproveInvalidData(scenario)
      }
    })

    it('should return error when requested network does not exist', async () => {
      mockSelectNetwork.mockImplementationOnce(() => () => undefined)

      const testRequest = createRequest(testParams)

      const result = await handler.approve(
        { request: testRequest, data: testData },
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.resourceNotFound('Network does not exist')
      })
    })

    it('should return error when requested account does not exist', async () => {
      mockSelectAccountByAddress.mockImplementationOnce(() => undefined)

      const testRequest = createRequest(testParams)

      const result = await handler.approve(
        { request: testRequest, data: testData },
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.resourceNotFound('Account does not exist')
      })
    })

    it('should sign + send transaction and return success with transaction hash', async () => {
      const mockSignedTx = '234rr3sd'
      mockSign.mockImplementationOnce(() => mockSignedTx)
      const mockTxHash = 'asdasxs'
      mockSendTransaction.mockImplementationOnce(() => mockTxHash)

      const testRequest = createRequest(testParams)

      const result = await handler.approve(
        { request: testRequest, data: testData },
        mockListenerApi
      )

      expect(mockSign).toHaveBeenCalledWith(
        {
          nonce: mockTransactionCount,
          chainId: mockNetwork.chainId,
          data: '0x10000',
          gasLimit: 256,
          maxFeePerGas: BigInt(testData.txParams.gasPrice),
          to: testData.txParams.to,
          value: testData.txParams.value
        },
        mockAccount.index,
        mockNetwork
      )

      expect(mockSendTransaction).toHaveBeenCalledWith(
        mockSignedTx,
        mockNetwork,
        false
      )

      expect(mockDispatch).toHaveBeenCalledWith(
        updateRequestStatus({
          id: testRequest.data.id,
          status: { result: mockTxHash }
        })
      )

      expect(result).toEqual({ success: true, value: mockTxHash })
    })

    it('should return error when failed to send transaction', async () => {
      const mockSignedTx = '234rr3sd'
      mockSign.mockImplementationOnce(() => mockSignedTx)

      const testError = Error('test error')
      mockSendTransaction.mockImplementationOnce(() => {
        throw testError
      })

      const testRequest = createRequest(testParams)

      const result = await handler.approve(
        { request: testRequest, data: testData },
        mockListenerApi
      )

      expect(mockSign).toHaveBeenCalledWith(
        {
          nonce: mockTransactionCount,
          chainId: mockNetwork.chainId,
          data: '0x10000',
          gasLimit: 256,
          maxFeePerGas: BigInt(testData.txParams.gasPrice),
          to: testData.txParams.to,
          value: testData.txParams.value
        },
        mockAccount.index,
        mockNetwork
      )

      expect(mockSendTransaction).toHaveBeenCalledWith(
        mockSignedTx,
        mockNetwork,
        false
      )

      expect(mockDispatch).toHaveBeenCalledWith(
        updateRequestStatus({
          id: testRequest.data.id,
          status: {
            error: ethErrors.rpc.internal(
              'Unable to approve transaction request'
            )
          }
        })
      )

      expect(mockCaptureException).toHaveBeenCalledWith(testError, {
        tags: { dapps: 'signTransactionV2' }
      })

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal('Unable to approve transaction request')
      })
    })
  })
})
