import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcProvider } from 'store/rpc/types'
import mockNetworks from 'tests/fixtures/networks.json'
import { ProposalTypes } from '@walletconnect/types'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { selectIsBlockaidDappScanBlocked } from 'store/posthog/slice'
import { AvalancheCaip2ChainId } from '@avalabs/core-chains-sdk'
import * as utils from './utils'
import { wcSessionRequestHandler as handler } from './wc_sessionRequest'

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  navigateToSessionProposal: jest.fn(),
  scanAndNavigateToSessionProposal: jest.fn()
}))

jest.mock('store/network/slice', () => {
  const actual = jest.requireActual('store/network/slice')
  return {
    ...actual,
    selectAllNetworks: () => mockNetworks,
    selectActiveNetwork: () => mockNetworks[43114],
    selectEnabledNetworks: () => [mockNetworks[43114]]
  }
})

jest.mock('store/posthog/slice', () => {
  const actual = jest.requireActual('store/posthog/slice')
  return {
    ...actual,
    selectIsBlockaidDappScanBlocked: jest.fn()
  }
})

const mockIsBlockaidDappScanBlocked =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectIsBlockaidDappScanBlocked as jest.MockedFunction<any>
mockIsBlockaidDappScanBlocked.mockReturnValue(true)

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

jest.mock('store/rpc/utils/createInAppRequest', () => {
  return {
    createInAppRequest: jest.fn()
  }
})

const testMethod = 'wc_sessionRequest' as RpcMethod.WC_SESSION_REQUEST

const validRequiredNamespaces = {
  eip155: {
    methods: ['eth_sendTransaction', 'personal_sign'],
    chains: ['eip155:43114', 'eip155:1'],
    events: [
      'chainChanged',
      'accountsChanged',
      'message',
      'disconnect',
      'connect'
    ],
    rpcMap: {
      '1': 'https://rpc.ankr.com/eth',
      '43114': 'https://api.avax.network/ext/bc/C/rpc'
    }
  }
}

const testNamespacesToApprove = {
  eip155: {
    chains: ['eip155:43114', 'eip155:1'],
    events: [
      'chainChanged',
      'accountsChanged',
      'message',
      'disconnect',
      'connect'
    ],
    methods: ['eth_sendTransaction', 'personal_sign']
  }
}

const testNonEVMNamespacesToApprove = {
  avax: {
    chains: [
      AvalancheCaip2ChainId.C,
      AvalancheCaip2ChainId.C_TESTNET,
      AvalancheCaip2ChainId.P,
      AvalancheCaip2ChainId.P_TESTNET,
      AvalancheCaip2ChainId.X,
      AvalancheCaip2ChainId.X_TESTNET
    ],
    methods: [
      RpcMethod.AVALANCHE_SEND_TRANSACTION,
      RpcMethod.AVALANCHE_SIGN_TRANSACTION,
      RpcMethod.AVALANCHE_SIGN_MESSAGE
    ],
    events: [
      'chainChanged',
      'accountsChanged',
      'message',
      'disconnect',
      'connect'
    ]
  },
  bip122: {
    chains: [
      'bip122:000000000019d6689c085ae165831e93',
      'bip122:000000000933ea01ad0ee984209779ba'
    ],
    methods: [
      RpcMethod.BITCOIN_SEND_TRANSACTION,
      RpcMethod.BITCOIN_SIGN_TRANSACTION
    ],
    events: [
      'chainChanged',
      'accountsChanged',
      'message',
      'disconnect',
      'connect'
    ]
  },
  solana: {
    chains: [
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
    ],
    methods: [
      RpcMethod.SOLANA_SIGN_MESSAGE,
      RpcMethod.SOLANA_SIGN_TRANSACTION,
      RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION
    ],
    events: [
      'chainChanged',
      'accountsChanged',
      'message',
      'disconnect',
      'connect'
    ]
  }
}

const createRequest = (
  requiredNamespaces: ProposalTypes.RequiredNamespaces,
  dappUrl = 'https://core.app'
): WCSessionProposal => {
  return {
    provider: RpcProvider.WALLET_CONNECT,
    method: testMethod,
    data: {
      id: 1678303290160528,
      params: {
        expiryTimestamp: 1678303596,
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
    error: rpcErrors.internal('Invalid approve data')
  })
}

describe('session_request handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['wc_sessionRequest'])
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
        error: rpcErrors.invalidParams(
          'Requested network cosmos:cosmoshub-1 is not supported'
        )
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

      const testRequest = createRequest(
        testRequiredNamespaces,
        'https://traderjoe.xyz'
      )

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('Networks not specified')
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
        error: rpcErrors.invalidParams(
          'Requested network eip155:4311322 is not supported'
        )
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
        error: rpcErrors.invalidParams(
          'Requested network eip155:4503599627370475 is not supported'
        )
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
        error: rpcErrors.invalidParams('Requested method is not authorized')
      })
    })

    it('should navigate to session proposal screen', async () => {
      const testRequest = createRequest(validRequiredNamespaces)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(utils.navigateToSessionProposal).toHaveBeenCalledWith({
        request: testRequest,
        namespaces: {
          ...testNamespacesToApprove,
          ...testNonEVMNamespacesToApprove
        }
      })

      expect(result).toEqual({ success: true, value: expect.any(Symbol) })
    })

    it('should scan dApp and navigate to session proposal screen', async () => {
      mockIsBlockaidDappScanBlocked.mockReturnValue(false)

      const testRequest = createRequest(validRequiredNamespaces)

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(utils.scanAndNavigateToSessionProposal).toHaveBeenCalledWith({
        dappUrl: 'https://core.app',
        request: testRequest,
        namespaces: {
          ...testNamespacesToApprove,
          ...testNonEVMNamespacesToApprove
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
        {
          addressC: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          addressBTC: 'btcAddress1',
          addressAVM: 'avmAddress1',
          addressPVM: 'pvmAddress1',
          addressCoreEth: 'coreEthAddress1',
          addressSVM: 'solanaAddress1'
        },
        {
          addressC: '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
          addressBTC: 'btcAddress2',
          addressAVM: 'avmAddress2',
          addressPVM: 'pvmAddress2',
          addressCoreEth: 'coreEthAddress2',
          addressSVM: 'solanaAddress2'
        }
      ]

      const testRequest = createRequest(
        validRequiredNamespaces,
        'https://traderjoe.xyz'
      )

      const result = await handler.approve({
        request: testRequest,
        data: {
          selectedAccounts: testSelectedAccounts,
          namespaces: testNamespacesToApprove
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
            'wallet_getEthereumChain',
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
        {
          addressC: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
          addressBTC: 'btcAddress1',
          addressAVM: 'avmAddress1',
          addressPVM: 'pvmAddress1',
          addressCoreEth: 'coreEthAddress1',
          addressSVM: 'solanaAddress1'
        },
        {
          addressC: '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
          addressBTC: 'btcAddress2',
          addressAVM: 'avmAddress2',
          addressPVM: 'pvmAddress2',
          addressCoreEth: 'coreEthAddress2',
          addressSVM: 'solanaAddress2'
        }
      ]

      const testRequest = createRequest(validRequiredNamespaces)

      const result = await handler.approve({
        request: testRequest,
        data: {
          selectedAccounts: testSelectedAccounts,
          namespaces: {
            ...testNamespacesToApprove,
            ...testNonEVMNamespacesToApprove
          }
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
            'wallet_getEthereumChain',
            'wallet_switchEthereumChain',
            'avalanche_createContact',
            'avalanche_getAccountPubKey',
            'avalanche_getAccounts',
            'avalanche_getBridgeState',
            'avalanche_getContacts',
            'avalanche_removeContact',
            'avalanche_selectAccount',
            'avalanche_setDeveloperMode',
            'avalanche_updateContact',
            'avalanche_getAddressesInRange',
            'avalanche_renameAccount'
          ],
          // all requested events
          events: validRequiredNamespaces.eip155.events
        },
        avax: {
          accounts: [
            'avax:8aDU0Kqh-5d23op-B-r-4YbQFRbsgF9a:0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            'avax:8aDU0Kqh-5d23op-B-r-4YbQFRbsgF9a:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
            'avax:YRLfeDBJpfEqUWe2FYR1OpXsnDDZeKWd:0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            'avax:YRLfeDBJpfEqUWe2FYR1OpXsnDDZeKWd:0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
            'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo:pvmAddress1',
            'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo:pvmAddress2',
            'avax:Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG:pvmAddress1',
            'avax:Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG:pvmAddress2',
            'avax:imji8papUf2EhV3le337w1vgFauqkJg-:avmAddress1',
            'avax:imji8papUf2EhV3le337w1vgFauqkJg-:avmAddress2',
            'avax:8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl:avmAddress1',
            'avax:8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl:avmAddress2'
          ],
          chains: [
            'avax:8aDU0Kqh-5d23op-B-r-4YbQFRbsgF9a',
            'avax:YRLfeDBJpfEqUWe2FYR1OpXsnDDZeKWd',
            'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo',
            'avax:Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG',
            'avax:imji8papUf2EhV3le337w1vgFauqkJg-',
            'avax:8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl'
          ],
          events: [
            'chainChanged',
            'accountsChanged',
            'message',
            'disconnect',
            'connect'
          ],
          methods: [
            'avalanche_sendTransaction',
            'avalanche_signTransaction',
            'avalanche_signMessage'
          ]
        },
        bip122: {
          accounts: [
            'bip122:000000000019d6689c085ae165831e93:btcAddress1',
            'bip122:000000000019d6689c085ae165831e93:btcAddress2',
            'bip122:000000000933ea01ad0ee984209779ba:btcAddress1',
            'bip122:000000000933ea01ad0ee984209779ba:btcAddress2'
          ],
          chains: [
            'bip122:000000000019d6689c085ae165831e93',
            'bip122:000000000933ea01ad0ee984209779ba'
          ],
          events: [
            'chainChanged',
            'accountsChanged',
            'message',
            'disconnect',
            'connect'
          ],
          methods: ['bitcoin_sendTransaction', 'bitcoin_signTransaction']
        },
        solana: {
          accounts: [
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:solanaAddress1',
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:solanaAddress2',
            'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1:solanaAddress1',
            'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1:solanaAddress2'
          ],
          chains: [
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
            'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
          ],
          events: [
            'chainChanged',
            'accountsChanged',
            'message',
            'disconnect',
            'connect'
          ],
          methods: [
            'solana_signMessage',
            'solana_signTransaction',
            'solana_signAndSendTransaction'
          ]
        }
      }

      expect(result).toEqual({ success: true, value: expectedNamespaces })
    })
  })
})
