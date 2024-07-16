import { rpcErrors, providerErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import mockNetworks from 'tests/fixtures/networks.json'
import { typedData } from 'tests/fixtures/rpc/typedData'
import WalletService from 'services/wallet/WalletService'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import * as Sentry from '@sentry/react-native'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { selectIsBlockaidTransactionValidationBlocked } from 'store/posthog/slice'
import { TransactionScanResponse } from 'services/blockaid/types'
import BlockaidService from 'services/blockaid/BlockaidService'
import { ethSignHandler as handler } from './eth_sign'

const mockSelectAccountByAddress = jest.fn()
jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectAccountByAddress: () => mockSelectAccountByAddress
  }
})

const mockSelectNetwork = jest.fn()
jest.mock('store/network/slice', () => {
  const actual = jest.requireActual('store/network/slice')
  return {
    ...actual,
    selectNetwork: () => mockSelectNetwork
  }
})
mockSelectNetwork.mockImplementation(() => mockNetworks[43114])

jest.mock('store/posthog/slice', () => {
  const actual = jest.requireActual('store/posthog/slice')
  return {
    ...actual,
    selectIsBlockaidTransactionValidationBlocked: jest.fn()
  }
})

const mockIsBlockaidTransactionValidationBlocked =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectIsBlockaidTransactionValidationBlocked as jest.MockedFunction<any>
mockIsBlockaidTransactionValidationBlocked.mockReturnValue(true)

const mockSignMessage = jest.fn()
jest.spyOn(WalletService, 'signMessage').mockImplementation(mockSignMessage)

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

const mockWCGetSession = jest.fn()
jest
  .spyOn(WalletConnectService, 'getSession')
  .mockImplementation(mockWCGetSession)

mockWCGetSession.mockImplementation(() => mockSession)

const approvedAddress = '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'

const testMethod = RpcMethod.SIGN_TYPED_DATA_V4

const createRequest = (
  params: unknown,
  provider: RpcProvider = RpcProvider.WALLET_CONNECT
): RpcRequest<typeof testMethod> => {
  return {
    provider,
    method: testMethod,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: testMethod,
          params
        },
        chainId: 'eip155:43114'
      }
    },
    peerMeta: {
      description: '',
      url: 'http://127.0.0.1:5173',
      icons: [],
      name: 'Playground'
    }
  }
}

describe('eth_sign handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual([
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v1',
      'eth_signTypedData_v3',
      'eth_signTypedData_v4'
    ])
  })

  describe('handle', () => {
    describe('wallet connect request', () => {
      it('should return error when params are invalid', async () => {
        const testRequest = createRequest([])

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).toEqual({
          success: false,
          error: rpcErrors.invalidParams('Invalid message params')
        })
      })

      it('should return error when session is not found', async () => {
        mockWCGetSession.mockImplementationOnce(() => undefined)

        const testParams = [
          '0xDA0E993876152ccA6053eeDFC753092c8cE712D0',
          typedData
        ]

        const testRequest = createRequest(testParams)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).toEqual({
          success: false,
          error: rpcErrors.internal('Session not found')
        })
      })

      it('should return error when requested address is not approved', async () => {
        const testParams = [
          '0xDA0E993876152ccA6053eeDFC753092c8cE712D0',
          typedData
        ]

        const testRequest = createRequest(testParams)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).toEqual({
          success: false,
          error: providerErrors.unauthorized(
            'Requested address is not authorized'
          )
        })
      })

      it('should return error when requested network does not exist', async () => {
        mockSelectNetwork.mockImplementationOnce(() => undefined)

        const testParams = [approvedAddress, typedData]

        const testRequest = createRequest(testParams)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).toEqual({
          success: false,
          error: rpcErrors.resourceNotFound('Network does not exist')
        })
      })

      it('should return error when requested account does not exist', async () => {
        mockSelectAccountByAddress.mockImplementationOnce(() => undefined)

        const testParams = [approvedAddress, typedData]

        const testRequest = createRequest(testParams)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).toEqual({
          success: false,
          error: rpcErrors.resourceNotFound('Account does not exist')
        })
      })

      it('should display prompt and return success', async () => {
        mockIsBlockaidTransactionValidationBlocked.mockReturnValue(true)
        mockSelectAccountByAddress.mockImplementationOnce(() => mockAccounts[1])

        const testParams = [approvedAddress, typedData]

        const testRequest = createRequest(testParams)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(mockNavigate).toHaveBeenCalledWith({
          name: AppNavigation.Root.Wallet,
          params: {
            screen: AppNavigation.Modal.SignMessageV2,
            params: {
              request: testRequest,
              data: typedData,
              network: mockNetworks[43114],
              account: mockAccounts[1]
            }
          }
        })

        expect(result).toEqual({ success: true, value: expect.any(Symbol) })
      })

      it('should navigate to malicious activity warning screen if transaction validation result is malicious', async () => {
        mockIsBlockaidTransactionValidationBlocked.mockReturnValue(false)
        mockSelectAccountByAddress.mockImplementationOnce(() => mockAccounts[1])

        const scanResponse: TransactionScanResponse = {
          validation: {
            result_type: 'Malicious',
            features: [],
            status: 'Success'
          },
          block: '0x123',
          chain: 'ethereum'
        }
        jest
          .spyOn(BlockaidService, 'scanJsonRpc')
          .mockResolvedValue(scanResponse)

        const testParams = [approvedAddress, typedData]

        const testRequest = createRequest(testParams)

        await handler.handle(testRequest, mockListenerApi)

        expect(mockNavigate).toHaveBeenCalledWith({
          name: AppNavigation.Root.Wallet,
          params: {
            screen: AppNavigation.Modal.MaliciousActivityWarning,
            params: {
              title: 'Scam Transaction',
              subTitle: 'This transaction is malicious, do not proceed.',
              rejectButtonTitle: 'Reject Transaction',
              onProceed: expect.any(Function),
              onReject: expect.any(Function)
            }
          }
        })
      })
    })

    it('should navigate to sign message screen if transaction validation result is not malicious', async () => {
      mockIsBlockaidTransactionValidationBlocked.mockReturnValue(false)
      mockSelectAccountByAddress.mockImplementationOnce(() => mockAccounts[1])

      const scanResponse: TransactionScanResponse = {
        validation: {
          result_type: 'Benign',
          features: [],
          status: 'Success'
        },
        block: '0x123',
        chain: 'ethereum'
      }
      jest.spyOn(BlockaidService, 'scanJsonRpc').mockResolvedValue(scanResponse)

      const testParams = [approvedAddress, typedData]

      const testRequest = createRequest(testParams)

      await handler.handle(testRequest, mockListenerApi)

      expect(mockNavigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.SignMessageV2,
          params: {
            request: testRequest,
            data: typedData,
            network: mockNetworks[43114],
            account: mockAccounts[1],
            scanResponse
          }
        }
      })
    })

    describe('non wallet connect request', () => {
      it('should return error when params are invalid', async () => {
        const testRequest = createRequest([], RpcProvider.CORE_MOBILE)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).toEqual({
          success: false,
          error: rpcErrors.invalidParams('Invalid message params')
        })
      })

      it('should not return error when session is not found', async () => {
        mockWCGetSession.mockImplementationOnce(() => undefined)

        const testParams = [
          '0xDA0E993876152ccA6053eeDFC753092c8cE712D0',
          typedData
        ]

        const testRequest = createRequest(testParams, RpcProvider.CORE_MOBILE)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).not.toEqual({
          success: false,
          error: rpcErrors.internal('Session not found')
        })
      })

      it('should not return error when requested address is not approved', async () => {
        const testParams = [
          '0xDA0E993876152ccA6053eeDFC753092c8cE712D0',
          typedData
        ]

        const testRequest = createRequest(testParams, RpcProvider.CORE_MOBILE)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).not.toEqual({
          success: false,
          error: providerErrors.unauthorized(
            'Requested address is not authorized'
          )
        })
      })

      it('should return error when requested network does not exist', async () => {
        mockSelectNetwork.mockImplementationOnce(() => undefined)

        const testParams = [approvedAddress, typedData]

        const testRequest = createRequest(testParams, RpcProvider.CORE_MOBILE)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).toEqual({
          success: false,
          error: rpcErrors.resourceNotFound('Network does not exist')
        })
      })

      it('should return error when requested account does not exist', async () => {
        mockSelectAccountByAddress.mockImplementationOnce(() => undefined)

        const testParams = [approvedAddress, typedData]

        const testRequest = createRequest(testParams, RpcProvider.CORE_MOBILE)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(result).toEqual({
          success: false,
          error: rpcErrors.resourceNotFound('Account does not exist')
        })
      })

      it('should display prompt and return success', async () => {
        mockIsBlockaidTransactionValidationBlocked.mockReturnValue(true)
        mockSelectAccountByAddress.mockImplementationOnce(() => mockAccounts[1])

        const testParams = [approvedAddress, typedData]

        const testRequest = createRequest(testParams, RpcProvider.CORE_MOBILE)

        const result = await handler.handle(testRequest, mockListenerApi)

        expect(mockNavigate).toHaveBeenCalledWith({
          name: AppNavigation.Root.Wallet,
          params: {
            screen: AppNavigation.Modal.SignMessageV2,
            params: {
              request: testRequest,
              data: typedData,
              network: mockNetworks[43114],
              account: mockAccounts[1]
            }
          }
        })

        expect(result).toEqual({ success: true, value: expect.any(Symbol) })
      })
    })
  })

  describe('approve', () => {
    it('should return error when approve data is invalid', async () => {
      const data = {
        data: typedData
      }
      const testParams = [approvedAddress, typedData]
      const testRequest = createRequest(testParams)

      const result = await handler.approve({ request: testRequest, data })

      expect(result).toEqual({
        success: false,
        error: rpcErrors.internal('Invalid approve data')
      })
    })

    it('should sign message and return success with encoded message', async () => {
      const mockEncodedMessage = 'asdasdasd'
      mockSignMessage.mockImplementationOnce(() => mockEncodedMessage)

      const testAccount = mockAccounts[0]
      const testNetwork = mockNetworks[43114]
      const data = {
        data: typedData,
        account: testAccount,
        network: testNetwork
      }
      const testParams = [approvedAddress, typedData]
      const testRequest = createRequest(testParams)

      const result = await handler.approve({
        request: testRequest,
        data
      })

      expect(mockSignMessage).toHaveBeenCalledWith({
        rpcMethod: testRequest.method,
        data: data.data,
        accountIndex: testAccount.index,
        network: testNetwork
      })

      expect(result).toEqual({ success: true, value: mockEncodedMessage })
    })

    it('should return error when failed to transfer asset', async () => {
      const testError = Error('test error')
      mockSignMessage.mockImplementationOnce(() => {
        throw testError
      })

      const testAccount = mockAccounts[0]
      const testNetwork = mockNetworks[43114]
      const data = {
        data: typedData,
        account: testAccount,
        network: testNetwork
      }
      const testParams = [approvedAddress, typedData]
      const testRequest = createRequest(testParams)

      const result = await handler.approve({
        request: testRequest,
        data
      })

      expect(mockSignMessage).toHaveBeenCalledWith({
        rpcMethod: testRequest.method,
        data: data.data,
        accountIndex: testAccount.index,
        network: testNetwork
      })

      expect(mockCaptureException).toHaveBeenCalledWith(testError, {
        tags: { dapps: 'signMessageV2' }
      })

      expect(result).toEqual({
        success: false,
        error: rpcErrors.internal('Unable to sign message')
      })
    })
  })
})
