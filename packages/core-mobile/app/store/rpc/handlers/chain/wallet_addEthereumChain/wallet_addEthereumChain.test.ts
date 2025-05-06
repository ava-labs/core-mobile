import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockNetworks from 'tests/fixtures/networks.json'
import * as networkUtils from 'services/network/utils/isValidRpcUrl'
import { addCustomNetwork, toggleEnabledChainId } from 'store/network'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { router } from 'expo-router'
import { walletAddEthereumChainHandler as handler } from './wallet_addEthereumChain'

const mockIsValidRPCUrl = jest.fn()
jest.spyOn(networkUtils, 'isValidRPCUrl').mockImplementation(mockIsValidRPCUrl)
mockIsValidRPCUrl.mockImplementation(() => true)

jest.mock('store/network/slice', () => {
  const actual = jest.requireActual('store/network/slice')
  return {
    ...actual,
    selectCustomNetworks: jest.fn(),
    selectAllNetworks: () => mockNetworks
  }
})

jest.mock('store/settings/advanced', () => {
  const actual = jest.requireActual('store/settings/advanced')
  return {
    ...actual,
    selectIsDeveloperMode: jest.fn()
  }
})

jest.mock('expo-router')

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const avalancheMainnetInfo = {
  chainId: '0xA86A',
  chainName: 'Avalanche (C-Chain)',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io'],
  iconUrls: [
    'https://glacier-api.avax.network/proxy/chain-assets/cb14a1f/chains/43114/chain-logo.png'
  ]
}

const ethMainnetInfo = {
  chainId: '0x1',
  description: 'The primary public Ethereum blockchain network.',
  chainName: 'Ethereum',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://proxy-api.avax.network/proxy/infura/mainnet'],
  blockExplorerUrls: ['https://etherscan.io'],
  iconUrls: [
    'https://glacier-api.avax.network/proxy/chain-assets/de66c50/non-subnet-chains/1/chain-logo.png'
  ]
}

const sepoliaMainnetInfo = {
  chainId: '0xaa36a7',
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'SEP',
    symbol: 'SEP',
    decimals: 18
  },
  rpcUrls: ['https://rpc.sepolia.dev'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
}

const testMethod = RpcMethod.WALLET_ADD_ETHEREUM_CHAIN

const createRequest = (
  params: unknown
): RpcRequest<RpcMethod.WALLET_ADD_ETHEREUM_CHAIN> => {
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
        chainId: 'eip155:43114'
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
    error: rpcErrors.invalidParams('Chain info is invalid')
  })
}

const testApproveInvalidData = async (data: unknown) => {
  const testRequest = createRequest([sepoliaMainnetInfo])

  const result = await handler.approve(
    { request: testRequest, data },
    mockListenerApi
  )

  expect(result).toEqual({
    success: false,
    error: rpcErrors.internal('Invalid approve data')
  })
}

const testShouldAskToAddNetwork = async ({
  isTestnet
}: {
  currentDeveloperMode: boolean
  isTestnet?: boolean
}) => {
  const testRequest =
    isTestnet !== undefined
      ? createRequest([{ ...sepoliaMainnetInfo, isTestnet }])
      : createRequest([sepoliaMainnetInfo])

  const result = await handler.handle(testRequest, mockListenerApi)

  expect(router.navigate).toHaveBeenCalledWith('/addEthereumChain')

  expect(result).toEqual({ success: true, value: expect.any(Symbol) })
}

describe('wallet_addEthereumChain handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['wallet_addEthereumChain'])
  })

  describe('handle', () => {
    it('should return error when params are invalid', async () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        [{ chainName: 'some name' }]
      ]

      for (const scenario of invalidParamsScenarios) {
        await testHandleInvalidParams(scenario)
      }
    })

    it('should return success when requested chain is already an existing chain and is active', async () => {
      const testParams = [avalancheMainnetInfo]

      const testRequest = createRequest(testParams)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({ success: true, value: null })
    })

    it('should return error when RPC url is missing', async () => {
      const { rpcUrls, ...ethMainnetInfoWithoutRpcUrl } = ethMainnetInfo
      const testRequest = createRequest([ethMainnetInfoWithoutRpcUrl])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('RPC url is missing')
      })
    })

    it('should return error when nativeCurrency is missing', async () => {
      const { nativeCurrency, ...ethMainnetInfoWithoutNativeCurrency } =
        ethMainnetInfo

      const testRequest = createRequest([ethMainnetInfoWithoutNativeCurrency])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams(
          'Expected nativeCurrency param to be defined'
        )
      })
    })

    it('should return success when network already exists', async () => {
      const testRequest = createRequest([ethMainnetInfo])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({ success: true, value: null })
    })

    it('should return error when network is not valid', async () => {
      mockIsValidRPCUrl.mockImplementationOnce(() => false)

      const testRequest = createRequest([sepoliaMainnetInfo])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('ChainID does not match the rpc url')
      })
    })

    describe('when request contains isTestnet field', () => {
      it('should ask to add network when network does not already exist and return success', async () => {
        await testShouldAskToAddNetwork({
          currentDeveloperMode: true,
          isTestnet: true
        })

        await testShouldAskToAddNetwork({
          currentDeveloperMode: true,
          isTestnet: false
        })

        await testShouldAskToAddNetwork({
          currentDeveloperMode: false,
          isTestnet: false
        })

        await testShouldAskToAddNetwork({
          currentDeveloperMode: false,
          isTestnet: true
        })
      })
    })

    describe('when request does not contain isTestnet field', () => {
      it('should ask to add network when network does not already exist and return success', async () => {
        await testShouldAskToAddNetwork({
          currentDeveloperMode: true
        })

        await testShouldAskToAddNetwork({
          currentDeveloperMode: false
        })
      })
    })
  })

  describe('approve', () => {
    beforeEach(() => {
      const mockSelectIsDeveloperMode =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectIsDeveloperMode as jest.MockedFunction<any>
      mockSelectIsDeveloperMode.mockImplementation(() => false)
    })

    it('should return error when approve data is invalid', async () => {
      const invalidDataScenarios = [null, {}, { network: null }]

      for (const scenario of invalidDataScenarios) {
        await testApproveInvalidData(scenario)
      }
    })

    it('should add and set custom network to enabled and return success', async () => {
      const testRequest = createRequest([sepoliaMainnetInfo])

      const testNetwork = {
        chainId: 11155111,
        chainName: 'Sepolia',
        description: '',
        explorerUrl: 'https://sepolia.etherscan.io',
        isTestnet: false,
        logoUri: '',
        mainnetChainId: 0,
        networkToken: {
          symbol: 'SEP',
          name: 'SEP',
          description: '',
          decimals: 18,
          logoUri: ''
        },
        platformChainId: '',
        rpcUrl: 'https://rpc.sepolia.dev',
        subnetId: '',
        vmId: '',
        vmName: 'EVM' as NetworkVMType
      }

      const result = await handler.approve(
        {
          request: testRequest,
          data: { network: testNetwork, isExisting: false }
        },
        mockListenerApi
      )

      expect(mockDispatch).toHaveBeenCalledWith(addCustomNetwork(testNetwork))
      expect(mockDispatch).toHaveBeenCalledWith(
        toggleEnabledChainId(testNetwork.chainId)
      )
      expect(mockDispatch).not.toHaveBeenCalledWith(toggleDeveloperMode())

      expect(result).toEqual({ success: true, value: null })
    })

    it('should add and set custom network to enabled, toggle dev mode and return success', async () => {
      const testRequest = createRequest([sepoliaMainnetInfo])

      const testNetwork = {
        chainId: 11155111,
        chainName: 'Sepolia',
        description: '',
        explorerUrl: 'https://sepolia.etherscan.io',
        isTestnet: true,
        logoUri: '',
        mainnetChainId: 0,
        networkToken: {
          symbol: 'SEP',
          name: 'SEP',
          description: '',
          decimals: 18,
          logoUri: ''
        },
        platformChainId: '',
        rpcUrl: 'https://rpc.sepolia.dev',
        subnetId: '',
        vmId: '',
        vmName: 'EVM' as NetworkVMType
      }

      const result = await handler.approve(
        {
          request: testRequest,
          data: { network: testNetwork, isExisting: true }
        },
        mockListenerApi
      )

      expect(mockDispatch).toHaveBeenCalledWith(addCustomNetwork(testNetwork))
      expect(mockDispatch).toHaveBeenCalledWith(
        toggleEnabledChainId(testNetwork.chainId)
      )
      expect(mockDispatch).toHaveBeenCalledWith(toggleDeveloperMode())

      expect(result).toEqual({ success: true, value: null })
    })
  })
})
