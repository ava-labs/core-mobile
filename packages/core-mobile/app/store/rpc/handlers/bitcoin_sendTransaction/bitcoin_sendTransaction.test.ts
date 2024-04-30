import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import mockNetworks from 'tests/fixtures/networks.json'
import * as Navigation from 'utils/Navigation'
import * as Sentry from '@sentry/react-native'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { selectNetwork } from 'store/network'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import * as utils from 'utils/isBtcAddress'
import * as accountStore from 'store/account/slice'
import BtcBalanceService from 'services/balance/BtcBalanceService'
import SendServiceBTC from 'services/send/SendServiceBTC'
import { DEFERRED_RESULT } from '../types'
import { bitcoinSendTransactionHandler as handler } from './bitcoin_sendTransaction'

const mockIsDeveloperMode = true
jest.mock('store/settings/advanced', () => {
  const actual = jest.requireActual('store/settings/advanced')
  return {
    ...actual,
    selectIsDeveloperMode: () => mockIsDeveloperMode
  }
})

const mockGetBalances = jest.fn()
jest.spyOn(BtcBalanceService, 'getBalances').mockImplementation(mockGetBalances)

const mockValidateStateAndCalculateFees = jest.fn()
jest
  .spyOn(SendServiceBTC, 'validateStateAndCalculateFees')
  .mockImplementation(mockValidateStateAndCalculateFees)

const mockGetTransactionRequest = jest.fn()
jest
  .spyOn(SendServiceBTC, 'getTransactionRequest')
  .mockImplementation(mockGetTransactionRequest)

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
mockSelectNetwork.mockImplementation(() => mockNetwork)

const mockAccount = jest.fn()
const mockSelectAccountByAddress = jest.fn()
jest
  .spyOn(accountStore, 'selectAccountByAddress')
  .mockImplementation(mockSelectAccountByAddress)
jest.spyOn(accountStore, 'selectActiveAccount').mockImplementation(mockAccount)

jest.mock('store/settings/currency', () => {
  const actual = jest.requireActual('store/settings/currency')
  return {
    ...actual,
    selectSelectedCurrency: () => 'usd' as VsCurrencyType
  }
})

const mockCaptureException = jest.fn()
jest.spyOn(Sentry, 'captureException').mockImplementation(mockCaptureException)

const mockNavigate = jest.fn()
jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

const mockIsBtcAddress = jest.fn().mockReturnValue(true)
jest.spyOn(utils, 'isBtcAddress').mockImplementation(mockIsBtcAddress)

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod = RpcMethod.BITCOIN_SEND_TRANSACTION

const testParams = ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0', '100', 1]
const createRequest = (
  params: unknown
): RpcRequest<RpcMethod.BITCOIN_SEND_TRANSACTION> => {
  return {
    provider: RpcProvider.WALLET_CONNECT,
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
    peerMeta: mockSession.peer.metadata
  }
}

const testHandleInvalidParams = async (params: unknown) => {
  const testRequest = createRequest(params)

  const result = await handler.handle(testRequest, mockListenerApi)

  expect(result).toEqual({
    success: false,
    error: ethErrors.rpc.invalidParams({
      message: 'Missing mandatory param(s)'
    })
  })
}

const approvedTestData = {
  sendState: {
    to: '0xcA0E993876',
    value: '100',
    fee: '1',
    nonce: 1,
    canSubmit: true
  },
  balance: {
    balance: '100',
    availableBalance: '100',
    lockedBalance: '0'
  }
}
describe('bitcoin_sendTransaction', () => {
  describe('handler', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockValidateStateAndCalculateFees.mockReturnValue({
        to: '0xcA0E993876',
        value: '100',
        fee: '1',
        nonce: 1,
        canSubmit: true
      })
      mockGetBalances.mockReturnValue([
        {
          balance: '100',
          availableBalance: '100',
          lockedBalance: '0'
        }
      ])
      mockAccount.mockReturnValue(mockAccounts[0])
      mockSelectAccountByAddress.mockReturnValue(mockAccount)
      mockIsBtcAddress.mockReturnValue(true)
    })

    it('should contain correct methods', () => {
      expect(handler.methods).toEqual(['bitcoin_sendTransaction'])
    })

    it('should navigate with approved data', async () => {
      const testRequest = createRequest(testParams)
      const result = await handler.handle(testRequest, mockListenerApi)
      expect(result).toEqual({
        success: true,
        value: DEFERRED_RESULT
      })
      expect(mockNavigate).toHaveBeenCalledWith({
        name: 'Root.Wallet',
        params: {
          params: {
            data: approvedTestData,
            request: testRequest
          },
          screen: 'ModalScreens.BitcoinSendTransaction'
        }
      })
    })

    it('should return error when params are invalid', async () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0'],
        ['0xcA0E993876152ccA6053eeDFC753092c8cE712D0', '100'],
        [1]
      ]

      for (const scenario of invalidParamsScenarios) {
        await testHandleInvalidParams(scenario)
      }
    })

    it('should return error if address is not btc address', async () => {
      mockIsBtcAddress.mockReturnValue(false)
      const testRequest = createRequest(testParams)
      const result = await handler.handle(testRequest, mockListenerApi)
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal('Not a valid address.')
      })
    })

    it('should return error if no active account', async () => {
      mockAccount.mockReturnValue(undefined)
      const testRequest = createRequest(testParams)
      const result = await handler.handle(testRequest, mockListenerApi)
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal('No active account found')
      })
    })
    it('should return error if no btc address', async () => {
      mockAccount.mockReturnValue({ ...mockAccount(), addressBTC: undefined })
      const testRequest = createRequest(testParams)
      const result = await handler.handle(testRequest, mockListenerApi)
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal(
          'The active account does not support BTC transactions'
        )
      })
    })
    it('should return error if no available btc balance', async () => {
      mockGetBalances.mockReturnValue([])
      const testRequest = createRequest(testParams)
      const result = await handler.handle(testRequest, mockListenerApi)
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal(
          'No balance found for the active account.'
        )
      })
    })
    it('should return error if sendState has error ', async () => {
      mockValidateStateAndCalculateFees.mockReturnValue({
        error: {
          error: 'error'
        }
      })
      const testRequest = createRequest(testParams)
      const result = await handler.handle(testRequest, mockListenerApi)
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal('Transaction rejected.')
      })
    })
    it('should return error if canSubmit is false ', async () => {
      mockValidateStateAndCalculateFees.mockReturnValue({
        canSubmit: false
      })
      const testRequest = createRequest(testParams)
      const result = await handler.handle(testRequest, mockListenerApi)
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal('Unable to construct the transaction.')
      })
    })
  })

  describe('approve', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockSendTransaction.mockResolvedValue('0x123')
      mockAccount.mockReturnValue(mockAccounts[0])
    })
    it('should return hash when transaction is signed and sent', async () => {
      const testRequest = createRequest(testParams)
      const result = await handler.approve(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { request: testRequest, data: approvedTestData as any },
        mockListenerApi
      )

      expect(result).toEqual({
        success: true,
        value: '0x123'
      })
    })

    it('should return error when active account has no btc address', async () => {
      mockAccount.mockReturnValue({ ...mockAccount(), addressBTC: undefined })
      const testRequest = createRequest(testParams)
      const result = await handler.approve(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { request: testRequest, data: approvedTestData as any },
        mockListenerApi
      )
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal(
          'The active account does not support BTC transactions'
        )
      })
    })

    it('should return error when getTransactionRequest fails', async () => {
      mockGetTransactionRequest.mockRejectedValueOnce(new Error('error'))
      const testRequest = createRequest(testParams)
      const result = await handler.approve(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { request: testRequest, data: approvedTestData as any },
        mockListenerApi
      )
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal('error')
      })
    })

    it('should return error when sign transaction fails', async () => {
      mockSign.mockRejectedValueOnce(new Error('error'))
      const testRequest = createRequest(testParams)
      const result = await handler.approve(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { request: testRequest, data: approvedTestData as any },
        mockListenerApi
      )
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal('error')
      })
    })

    it('should return error when send transaction fails', async () => {
      mockSendTransaction.mockRejectedValueOnce(new Error('error'))
      const testRequest = createRequest(testParams)
      const result = await handler.approve(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { request: testRequest, data: approvedTestData as any },
        mockListenerApi
      )
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal('error')
      })
    })
  })
})
