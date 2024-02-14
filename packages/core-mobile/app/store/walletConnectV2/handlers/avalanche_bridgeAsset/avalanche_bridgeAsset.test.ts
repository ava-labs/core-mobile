import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod } from 'store/walletConnectV2'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import mockNetworks from 'tests/fixtures/networks.json'
import mockBridgeConfig from 'tests/fixtures/bridgeConfig'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import BridgeService from 'services/bridge/BridgeService'
import * as Sentry from '@sentry/react-native'
import { bnToBig, stringToBN } from '@avalabs/utils-sdk'
import { avalancheBridgeAssetHandler as handler } from './avalanche_bridgeAsset'

const mockActiveAccount = mockAccounts[0]
jest.mock('store/account', () => {
  const actual = jest.requireActual('store/account')
  return {
    ...actual,
    selectActiveAccount: () => mockActiveAccount
  }
})

jest.mock('store/network', () => {
  const actual = jest.requireActual('store/network')
  return {
    ...actual,
    selectNetworks: () => mockNetworks
  }
})

const mockIsDeveloperMode = true
jest.mock('store/settings/advanced', () => {
  const actual = jest.requireActual('store/settings/advanced')
  return {
    ...actual,
    selectIsDeveloperMode: () => mockIsDeveloperMode
  }
})

jest.mock('store/bridge/slice', () => {
  const actual = jest.requireActual('store/bridge/slice')
  return {
    ...actual,
    selectBridgeAppConfig: () => mockBridgeConfig
  }
})

const mockTx = { a: 1 }
const mockTransferAsset = jest.fn()
jest.spyOn(BridgeService, 'transferAsset').mockImplementation(mockTransferAsset)
mockTransferAsset.mockResolvedValue(mockTx)

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

const testMethod = 'avalanche_bridgeAsset' as RpcMethod.AVALANCHE_BRIDGE_ASSET

const testAsset = {
  assetType: 1,
  avaxPromotionAmount: '100000000000000000',
  avaxPromotionDollarThreshold: 1,
  denomination: 18,
  nativeContractAddress: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
  nativeNetwork: 'ethereum',
  offboardFeeDollars: 1,
  offboardFeeProcessThreshold: '1000000000000000000',
  symbol: 'WETH',
  tokenName: 'Wrapped Ether',
  wrappedContractAddress: '0x678c4c42572ec1c44b144c5a6712b69d2a5d412c',
  wrappedNetwork: 'avalanche'
}
const testParams = ['avalanche', '0.01', testAsset]

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

  const result = await handler.handle(testRequest)

  expect(result).toEqual({
    success: false,
    error: ethErrors.rpc.invalidParams({
      message: 'Params are invalid'
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

describe('avalanche_bridgeAsset handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['avalanche_bridgeAsset'])
  })

  describe('handle', () => {
    it('should return error when params are invalid', async () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        ['avalanche'],
        ['avalanche', '0.01'],
        [testAsset]
      ]

      for (const scenario of invalidParamsScenarios) {
        await testHandleInvalidParams(scenario)
      }
    })

    it('should display prompt and return success', async () => {
      const testRequest = createRequest(testParams)

      const result = await handler.handle(testRequest)

      expect(mockNavigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.BridgeAssetV2,
          params: {
            request: testRequest,
            amountStr: '0.01',
            asset: testAsset,
            currentBlockchain: 'avalanche'
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
        { amountStr: '0.01' },
        { asset: testAsset },
        { currentBlockchain: 'avalanche' }
      ]

      for (const scenario of invalidDataScenarios) {
        await testApproveInvalidData(scenario)
      }
    })

    it('should transfer asset and return success with transaction', async () => {
      const testRequest = createRequest(testParams)

      const result = await handler.approve(
        {
          request: testRequest,
          data: {
            amountStr: '0.01',
            asset: testAsset,
            currentBlockchain: 'avalanche',
            maxFeePerGas: 100n,
            maxPriorityFeePerGas: 100n
          }
        },
        mockListenerApi
      )

      expect(mockTransferAsset).toHaveBeenCalledWith({
        currentBlockchain: 'avalanche',
        amount: bnToBig(stringToBN('0.01', 18), 18),
        asset: testAsset,
        config: mockBridgeConfig,
        activeAccount: mockActiveAccount,
        allNetworks: mockNetworks,
        isTestnet: mockIsDeveloperMode,
        maxFeePerGas: 100n,
        maxPriorityFeePerGas: 100n
      })

      expect(result).toEqual({ success: true, value: mockTx })
    })

    it('should return error when failed to transfer asset', async () => {
      const testError = Error('test error')
      mockTransferAsset.mockImplementationOnce(() => {
        throw testError
      })

      const testRequest = createRequest(testParams)

      const result = await handler.approve(
        {
          request: testRequest,
          data: {
            amountStr: '0.01',
            asset: testAsset,
            currentBlockchain: 'avalanche',
            maxFeePerGas: 100n
          }
        },
        mockListenerApi
      )

      expect(mockTransferAsset).toHaveBeenCalledWith({
        currentBlockchain: 'avalanche',
        amount: bnToBig(stringToBN('0.01', 18), 18),
        asset: testAsset,
        config: mockBridgeConfig,
        activeAccount: mockActiveAccount,
        allNetworks: mockNetworks,
        isTestnet: mockIsDeveloperMode,
        maxFeePerGas: 100n,
        maxPriorityFeePerGas: undefined
      })

      expect(mockCaptureException).toHaveBeenCalledWith(testError, {
        tags: { dapps: 'bridgeAssetV2' }
      })

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.internal('Unable to transfer asset')
      })
    })
  })
})
