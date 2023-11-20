import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod } from 'store/walletConnectV2/types'
import mockNetworks from 'tests/fixtures/networks.json'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { ProposalTypes } from '@walletconnect/types'
import { sessionRequestHandler as handler } from './session_request'

jest.mock('store/network', () => {
  const actual = jest.requireActual('store/network')
  return {
    ...actual,
    selectAllNetworks: () => mockNetworks
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

const testMethod = 'session_request' as RpcMethod.SESSION_REQUEST

const validRequiredNamespaces = {
  eip155: {
    methods: ['eth_sendTransaction', 'personal_sign'],
    chains: ['eip155:43114', 'eip155:1'],
    events: ['chainChanged', 'accountsChanged'],
    rpcMap: {
      '1': 'https://rpc.ankr.com/eth',
      '43114': 'https://api.avax.network/ext/bc/C/rpc'
    }
  }
}

const createRequest = (
  requiredNamespaces: ProposalTypes.RequiredNamespaces,
  dappUrl = 'https://core.app'
) => {
  return {
    method: testMethod,
    data: {
      id: 1678303290160528,
      params: {
        id: 1678303290160528,
        pairingTopic:
          '73af283605154f5a8643286042e6671df51a180ecebc88d6715a7b86cfae5fb3',
        expiry: 1678303596,
        requiredNamespaces,
        optionalNamespaces: {},
        relays: [{ protocol: 'irn' }],
        proposer: {
          publicKey:
            '95cb51ec29dd245d2270d1b7725fdc2f2e3f2180dd68c84910fa172324889a67',
          metadata: {
            description:
              'core, decentralized finance, defi assets, track defi, monitor defi, defi portfolio, defi, uniswap, sushiswap, track, monitor, synthetix, zerion, debank',
            url: dappUrl,
            icons: ['https://core.app/apple-touch-icon.png'],
            name: 'Core'
          }
        }
      },
      verifyContext: {
        verified: {
          origin: '',
          validation: 'UNKNOWN' as 'UNKNOWN' | 'VALID' | 'INVALID',
          verifyUrl: ''
        }
      }
    }
  }
}

const testApproveInvalidData = async (data: unknown) => {
  const testRequest = createRequest(validRequiredNamespaces)

  const result = await handler.approve({
    request: testRequest,
    data
  })

  expect(result).toEqual({
    success: false,
    error: ethErrors.rpc.internal('Invalid approve data')
  })
}

describe('session_request handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['session_request'])
  })

  describe('handle', () => {
    it('should return error when required namespaces contains non-EIP155 namespaces', async () => {
      const testRequiredNamespaces = {
        eip155: {
          methods: ['eth_sendTransaction'],
          chains: ['eip155:43114'],
          events: ['chainChanged', 'accountsChanged']
        },
        cosmos: {
          chains: ['cosmos:cosmoshub-1'],
          methods: ['cosmos_getAccounts', 'cosmos_signDirect'],
          events: []
        }
      }
      const testRequest = createRequest(testRequiredNamespaces)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Only eip155 namespace is supported'
        })
      })
    })

    it('should return error when required EIP155 namespace does not specify any chains', async () => {
      const testRequiredNamespaces = {
        eip155: {
          methods: ['eth_sendTransaction'],
          chains: [],
          events: ['chainChanged', 'accountsChanged']
        }
      }
      const testRequest = createRequest(testRequiredNamespaces)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: `Networks not specified`
        })
      })
    })

    it('should return error when required EIP155 namespace specifies non-supported chains', async () => {
      const testRequiredNamespaces = {
        eip155: {
          methods: ['eth_sendTransaction'],
          chains: ['eip155:4311322'],
          events: ['chainChanged', 'accountsChanged']
        }
      }
      const testRequest = createRequest(testRequiredNamespaces)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Requested network eip155:4311322 is not supported'
        })
      })
    })

    it('should return error when required EIP155 namespace specifies non-evm chains', async () => {
      const testRequiredNamespaces = {
        eip155: {
          methods: ['eth_sendTransaction'],
          chains: ['eip155:4503599627370475'],
          events: ['chainChanged', 'accountsChanged']
        }
      }
      const testRequest = createRequest(testRequiredNamespaces)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Requested network eip155:4503599627370475 is not supported'
        })
      })
    })

    it('should return error when required EIP155 namespace specifies Core methods while dApp is not Core', async () => {
      const testRequiredNamespaces = {
        eip155: {
          methods: [
            'eth_sendTransaction',
            'avalanche_getContacts',
            'avalanche_createContact'
          ],
          chains: ['eip155:43114'],
          events: ['chainChanged', 'accountsChanged']
        }
      }
      const testRequest = createRequest(
        testRequiredNamespaces,
        'https://traderjoe.xyz'
      )

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: `Requested method is not authorized`
        })
      })
    })

    it('should display prompt and return success', async () => {
      const testRequest = createRequest(validRequiredNamespaces)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(mockNavigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.SessionProposalV2,
          params: { request: testRequest, chainIds: [43114, 1] }
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
        { selectedAccounts: null },
        { selectedAccounts: [] }
      ]

      for (const scenario of invalidDataScenarios) {
        await testApproveInvalidData(scenario)
      }
    })

    it('should return success with correct namespaces for a non-Core dApp', async () => {
      const testSelectedAccounts = [
        '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
        '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318'
      ]

      const testApprovedChainIds = [43114, 1]

      const testRequest = createRequest(
        validRequiredNamespaces,
        'https://traderjoe.xyz'
      )

      const result = await handler.approve({
        request: testRequest,
        data: {
          selectedAccounts: testSelectedAccounts,
          approvedChainIds: testApprovedChainIds
        }
      })

      const expectedNamespaces = {
        eip155: {
          // all requested accounts
          accounts: [
            'eip155:43114:0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            'eip155:43114:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
            'eip155:1:0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            'eip155:1:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318'
          ],
          chains: ['eip155:43114', 'eip155:1'],
          // all methods we support
          methods: [
            'eth_sendTransaction',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
            'eth_signTypedData_v1',
            'eth_signTypedData',
            'personal_sign',
            'eth_sign',
            'wallet_addEthereumChain',
            'wallet_switchEthereumChain'
          ],
          // all requested events
          events: validRequiredNamespaces.eip155.events
        }
      }

      expect(result).toEqual({ success: true, value: expectedNamespaces })
    })

    it('should return success with correct namespaces for a Core dApp', async () => {
      const testSelectedAccounts = [
        '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
        '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318'
      ]

      const testApprovedChainIds = [43114, 1]

      const testRequest = createRequest(validRequiredNamespaces)

      const result = await handler.approve({
        request: testRequest,
        data: {
          selectedAccounts: testSelectedAccounts,
          approvedChainIds: testApprovedChainIds
        }
      })

      const expectedNamespaces = {
        eip155: {
          // all requested accounts
          accounts: [
            'eip155:43114:0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            'eip155:43114:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
            'eip155:1:0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            'eip155:1:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318'
          ],
          chains: ['eip155:43114', 'eip155:1'],
          // all methods we support
          methods: [
            'eth_sendTransaction',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
            'eth_signTypedData_v1',
            'eth_signTypedData',
            'personal_sign',
            'eth_sign',
            'wallet_addEthereumChain',
            'wallet_switchEthereumChain',
            'avalanche_bridgeAsset',
            'avalanche_createContact',
            'avalanche_getAccountPubKey',
            'avalanche_getAccounts',
            'avalanche_getBridgeState',
            'avalanche_getContacts',
            'avalanche_removeContact',
            'avalanche_selectAccount',
            'avalanche_setDeveloperMode',
            'avalanche_updateContact',
            'avalanche_sendTransaction',
            'avalanche_signTransaction'
          ],
          // all requested events
          events: validRequiredNamespaces.eip155.events
        }
      }

      expect(result).toEqual({ success: true, value: expectedNamespaces })
    })
  })
})
