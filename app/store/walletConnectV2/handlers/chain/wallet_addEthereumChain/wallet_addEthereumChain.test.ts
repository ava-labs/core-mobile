import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod } from 'store/walletConnectV2/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockNetworks from 'tests/fixtures/networks.json'
import AppNavigation from 'navigation/AppNavigation'
import * as networkUtils from 'services/network/utils/isValidRpcUrl'
import * as Navigation from 'utils/Navigation'
import { setActive, addCustomNetwork } from 'store/network'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { walletAddEthereumChainHandler as handler } from './wallet_addEthereumChain'

const mockIsValidRPCUrl = jest.fn()
jest.spyOn(networkUtils, 'isValidRPCUrl').mockImplementation(mockIsValidRPCUrl)
mockIsValidRPCUrl.mockImplementation(() => true)

const mockActiveNetwork = mockNetworks[43114]

jest.mock('store/network', () => {
  const actual = jest.requireActual('store/network')
  return {
    ...actual,
    selectActiveNetwork: () => mockActiveNetwork,
    selectNetworks: () => mockNetworks
  }
})

const mockNavigate = jest.fn()
jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

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

const testMethod =
  'wallet_addEthereumChain' as RpcMethod.WALLET_ADD_ETHEREUM_CHAIN

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
        chainId: 'eip155:43114'
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
      message: 'Chain info is invalid'
    })
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
    error: ethErrors.rpc.internal('Invalid approve data')
  })
}

describe('wallet_addEthereumChain handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['wallet_addEthereumChain'])
  })

  describe('handle', () => {
    // eslint-disable-next-line jest/expect-expect
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
        error: ethErrors.rpc.invalidParams({
          message: 'RPC url is missing'
        })
      })
    })

    it('should return error when nativeCurrency is missing', async () => {
      const { nativeCurrency, ...ethMainnetInfoWithoutNativeCurrency } =
        ethMainnetInfo

      const testRequest = createRequest([ethMainnetInfoWithoutNativeCurrency])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Expected nativeCurrency param to be defined'
        })
      })
    })

    it('should ask to switch network when network already exists and return success', async () => {
      const testRequest = createRequest([ethMainnetInfo])

      const result = await handler.handle(testRequest, mockListenerApi)

      const expectedNetwork = {
        chainId: 1,
        chainName: 'Ethereum',
        description: '',
        explorerUrl: 'https://etherscan.io',
        isTestnet: false,
        logoUri:
          'https://glacier-api.avax.network/proxy/chain-assets/de66c50/non-subnet-chains/1/chain-logo.png',
        mainnetChainId: 0,
        networkToken: {
          symbol: 'ETH',
          name: 'Ethereum',
          description: '',
          decimals: 18,
          logoUri:
            'https://glacier-api.avax.network/proxy/chain-assets/de66c50/non-subnet-chains/1/chain-logo.png'
        },
        platformChainId: '',
        primaryColor: '',
        rpcUrl: 'https://proxy-api.avax.network/proxy/infura/mainnet',
        subnetId: '',
        vmId: '',
        vmName: 'EVM'
      }

      expect(mockNavigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.AddEthereumChainV2,
          params: {
            request: testRequest,
            network: expectedNetwork,
            isExisting: true
          }
        }
      })

      expect(result).toEqual({ success: true, value: expect.any(Symbol) })
    })

    it('should return error when network is not valid', async () => {
      mockIsValidRPCUrl.mockImplementationOnce(() => false)

      const testRequest = createRequest([sepoliaMainnetInfo])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'ChainID does not match the rpc url'
        })
      })
    })

    it('should ask to add network when network does not already exist and return success', async () => {
      const testRequest = createRequest([sepoliaMainnetInfo])

      const result = await handler.handle(testRequest, mockListenerApi)

      const expectedNetwork = {
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
        primaryColor: '',
        rpcUrl: 'https://rpc.sepolia.dev',
        subnetId: '',
        vmId: '',
        vmName: 'EVM'
      }

      expect(mockNavigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.AddEthereumChainV2,
          params: {
            request: testRequest,
            network: expectedNetwork,
            isExisting: false
          }
        }
      })

      expect(result).toEqual({ success: true, value: expect.any(Symbol) })
    })
  })

  describe('approve', () => {
    // eslint-disable-next-line jest/expect-expect
    it('should return error when approve data is invalid', async () => {
      const invalidDataScenarios = [
        null,
        {},
        { network: null },
        { network: mockActiveNetwork }
      ]

      for (const scenario of invalidDataScenarios) {
        await testApproveInvalidData(scenario)
      }
    })

    it('should add and set custom network to active and return success', async () => {
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
      expect(mockDispatch).toHaveBeenCalledWith(setActive(testNetwork.chainId))

      expect(result).toEqual({ success: true, value: null })
    })

    it('should set custom network to active and return success', async () => {
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
          data: { network: testNetwork, isExisting: true }
        },
        mockListenerApi
      )

      expect(mockDispatch).not.toHaveBeenCalledWith(
        addCustomNetwork(testNetwork)
      )
      expect(mockDispatch).toHaveBeenCalledWith(setActive(testNetwork.chainId))

      expect(result).toEqual({ success: true, value: null })
    })
  })
})
