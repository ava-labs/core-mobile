import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockNetworks from 'tests/fixtures/networks.json'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { setActive } from 'store/network'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { walletSwitchEthereumChainHandler as handler } from './wallet_switchEthereumChain'
const mockActiveNetwork = mockNetworks[43114]

jest.mock('store/network', () => {
  const actual = jest.requireActual('store/network')
  return {
    ...actual,
    selectActiveNetwork: () => mockActiveNetwork,
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

const mockNavigate = jest.fn()
jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod = RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN

const createRequest = (
  params: unknown
): RpcRequest<RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN> => {
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
    error: ethErrors.rpc.invalidParams({
      message: 'Chain ID is invalid'
    })
  })
}

const testApproveInvalidData = async (data: unknown) => {
  const testRequest = createRequest([{ chainId: '0x1' }])

  const result = await handler.approve(
    { request: testRequest, data },
    mockListenerApi
  )

  expect(result).toEqual({
    success: false,
    error: ethErrors.rpc.internal('Invalid approve data')
  })
}

describe('wallet_switchEthereumChain handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['wallet_switchEthereumChain'])
  })

  describe('handle', () => {
    it('should return error when params are invalid', async () => {
      const invalidParamsScenarios = [
        null,
        [],
        [null],
        [{}],
        [{ someKey: 'some value' }]
      ]

      for (const scenario of invalidParamsScenarios) {
        await testHandleInvalidParams(scenario)
      }
    })

    it('should return success when requested chain is already active', async () => {
      const testRequest = createRequest([{ chainId: '0xA86A' }]) // 0xA86A is 43114 (in decimal)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({ success: true, value: null })
    })

    it('should ask to switch network when network is supported and return success', async () => {
      const testRequest = createRequest([{ chainId: '0x1' }]) // 0x1 is 1 (in decimal)

      const result = await handler.handle(testRequest, mockListenerApi)

      const expectedNetwork = mockNetworks[1]

      expect(mockNavigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.SwitchEthereumChainV2,
          params: { request: testRequest, network: expectedNetwork }
        }
      })

      expect(result).toEqual({ success: true, value: expect.any(Symbol) })
    })

    it('should return error when network is not supported', async () => {
      const testRequest = createRequest([{ chainId: '0x134343242134324' }])

      const result = await handler.handle(testRequest, mockListenerApi)

      const expectedNetwork = mockNetworks[1]

      expect(mockNavigate).not.toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.SwitchEthereumChainV2,
          params: { request: testRequest, network: expectedNetwork }
        }
      })

      expect(result).toEqual({
        success: false,
        error: ethErrors.provider.custom({
          code: 4902,
          message: `Unrecognized chain ID "${Number(
            // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
            0x134343242134324
          )}". Try adding the chain using ${
            RpcMethod.WALLET_ADD_ETHEREUM_CHAIN
          } first.`
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

    it('should set requested network to active and return success', async () => {
      const testRequest = createRequest([{ chainId: '0x1' }])

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
        rpcUrl: 'https://proxy-api.avax.network/proxy/infura/mainnet',
        subnetId: '',
        vmId: '',
        vmName: 'EVM'
      }

      const result = await handler.approve(
        {
          request: testRequest,
          data: { network: expectedNetwork }
        },
        mockListenerApi
      )

      expect(mockDispatch).not.toHaveBeenCalledWith(toggleDeveloperMode())

      expect(mockDispatch).toHaveBeenCalledWith(
        setActive(expectedNetwork.chainId)
      )

      expect(result).toEqual({ success: true, value: null })
    })

    it('should set requested network to active, toggle dev mode and return success', async () => {
      const testRequest = createRequest([{ chainId: '0x0xaa36a7' }])

      const expectedNetwork = {
        chainId: 11155111,
        chainName: 'Sepolia',
        description: '',
        explorerUrl: 'https://sepolia.etherscan.io',
        isTestnet: true,
        mainnetChainId: 0,
        logoUri: '',
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
        vmName: 'EVM'
      }

      const result = await handler.approve(
        {
          request: testRequest,
          data: { network: expectedNetwork }
        },
        mockListenerApi
      )

      expect(mockDispatch).toHaveBeenCalledWith(toggleDeveloperMode())

      expect(mockDispatch).toHaveBeenCalledWith(
        setActive(expectedNetwork.chainId)
      )

      expect(result).toEqual({ success: true, value: null })
    })
  })
})
