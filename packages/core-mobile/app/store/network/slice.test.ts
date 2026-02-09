/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ChainId as ChainsSDKChainId,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'
import { getNetworksFromCache } from 'hooks/networks/utils/getNetworksFromCache'
import { RootState } from 'store/types'
import {
  selectActiveChainId,
  selectEnabledChainIds,
  selectCustomNetworks,
  selectEnabledNetworks,
  selectEnabledNetworksByTestnet,
  networkReducer,
  setActive,
  toggleEnabledChainId,
  toggleDisabledLastTransactedChainId,
  addCustomNetwork,
  updateCustomNetwork,
  removeCustomNetwork,
  enableL2ChainIds,
  alwaysEnabledChainIds,
  defaultEnabledL2ChainIds,
  noActiveNetwork
} from './slice'
import { NetworkState } from './types'

// Mock dependencies before imports
jest.mock('hooks/networks/utils/getNetworksFromCache', () => ({
  getNetworksFromCache: jest.fn()
}))

jest.mock('store/posthog/slice', () => ({
  selectIsSolanaSupportBlocked: jest.fn(() => false)
}))

const mockGetNetworks = getNetworksFromCache as jest.MockedFunction<
  typeof getNetworksFromCache
>

/**
 * Tests for the network slice
 */

describe('network slice', () => {
  describe('selectors', () => {
    const mockNetworks = {
      43114: {
        chainId: 43114,
        chainName: 'Avalanche',
        isTestnet: false,
        vmName: NetworkVMType.EVM,
        networkToken: {
          name: 'AVAX',
          symbol: 'AVAX',
          description: 'Avalanche',
          decimals: 18,
          logoUri: ''
        },
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        explorerUrl: 'https://snowtrace.io',
        logoUri: ''
      },
      1: {
        chainId: 1,
        chainName: 'Ethereum',
        isTestnet: false,
        vmName: NetworkVMType.EVM,
        networkToken: {
          name: 'ETH',
          symbol: 'ETH',
          description: 'Ethereum',
          decimals: 18,
          logoUri: ''
        },
        rpcUrl: 'https://mainnet.infura.io/v3',
        explorerUrl: 'https://etherscan.io',
        logoUri: ''
      },
      [ChainsSDKChainId.SOLANA_MAINNET_ID]: {
        chainId: ChainsSDKChainId.SOLANA_MAINNET_ID,
        chainName: 'Solana',
        isTestnet: false,
        vmName: NetworkVMType.SVM,
        networkToken: {
          name: 'SOL',
          symbol: 'SOL',
          description: 'Solana',
          decimals: 9,
          logoUri: ''
        },
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        explorerUrl: 'https://explorer.solana.com',
        logoUri: ''
      }
    }

    beforeEach(() => {
      mockGetNetworks.mockReturnValue(mockNetworks)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    const createMockState = (overrides?: Partial<RootState>): RootState => {
      return {
        network: {
          customNetworks: {},
          enabledChainIds: [43114, 1],
          disabledLastTransactedChainIds: [],
          active: 43114
        },
        settings: {
          advanced: {
            isDeveloperMode: false
          }
        },
        posthog: {
          flags: {},
          featureFlags: {
            'solana-support': true,
            everything: true
          }
        },
        wallet: {
          wallets: {},
          activeWalletId: null,
          isMigratingActiveAccounts: false
        },
        account: {
          active: undefined,
          accounts: {},
          accountsState: {},
          ledgerAddresses: {},
          activeAccountIndex: 0
        },
        ...overrides
      } as unknown as RootState
    }

    describe('selectActiveChainId', () => {
      it('should return active chainId', () => {
        const state = createMockState()
        expect(selectActiveChainId(state)).toBe(43114)
      })

      it('should return 0 when no active network', () => {
        const state = createMockState({
          network: {
            customNetworks: {},
            enabledChainIds: [43114, 1],
            disabledLastTransactedChainIds: [],
            active: 0
          }
        } as Partial<RootState>)
        expect(selectActiveChainId(state)).toBe(0)
      })
    })

    describe('selectEnabledChainIds', () => {
      it('should return enabled chain IDs', () => {
        const state = createMockState()
        const result = selectEnabledChainIds(state)
        expect(result).toEqual([43114, 1])
      })

      it('should return empty array when no chains enabled', () => {
        const state = createMockState({
          network: {
            customNetworks: {},
            enabledChainIds: [],
            disabledLastTransactedChainIds: [],
            active: 0
          }
        } as Partial<RootState>)
        expect(selectEnabledChainIds(state)).toEqual([])
      })
    })

    describe('selectCustomNetworks', () => {
      it('should return empty object when no custom networks', () => {
        const state = createMockState()
        expect(selectCustomNetworks(state)).toEqual({})
      })

      it('should return custom networks', () => {
        const customNetwork = {
          chainId: 99999,
          chainName: 'Custom',
          isTestnet: false,
          vmName: NetworkVMType.EVM,
          networkToken: {
            name: 'CUST',
            symbol: 'CST',
            description: 'Custom',
            decimals: 18,
            logoUri: ''
          },
          rpcUrl: 'https://custom.com',
          explorerUrl: 'https://explorer.com',
          logoUri: ''
        }
        const state = createMockState({
          network: {
            customNetworks: { 99999: customNetwork },
            enabledChainIds: [43114, 1],
            disabledLastTransactedChainIds: [],
            active: 43114
          }
        } as Partial<RootState>)
        expect(selectCustomNetworks(state)).toEqual({ 99999: customNetwork })
      })
    })

    describe('selectEnabledNetworks', () => {
      it('should return array type', () => {
        const state = createMockState()
        const result = selectEnabledNetworks(state)

        expect(Array.isArray(result)).toBe(true)
      })

      it('should return dense array without undefined values', () => {
        const state = createMockState({
          network: {
            customNetworks: {},
            enabledChainIds: [1, 43114],
            disabledLastTransactedChainIds: [],
            active: 1
          }
        } as Partial<RootState>)

        const result = selectEnabledNetworks(state)

        // Verify it's a dense array (no undefined values)
        expect(result.every(n => n !== undefined)).toBe(true)
        // Verify it's not a sparse array - should not have length in the thousands
        expect(result.length).toBeLessThan(1000)
      })
    })

    describe('selectEnabledNetworksByTestnet', () => {
      it('should return dense array without undefined values', () => {
        const state = createMockState()
        const result = selectEnabledNetworksByTestnet(false)(state)

        expect(Array.isArray(result)).toBe(true)
        expect(result.every(n => n !== undefined)).toBe(true)
        // Should not create sparse array for large chainIds
        expect(result.length).toBeLessThan(100)
      })

      it('should filter by testnet flag', () => {
        const state = createMockState()
        const mainnetResult = selectEnabledNetworksByTestnet(false)(state)
        const testnetResult = selectEnabledNetworksByTestnet(true)(state)

        expect(mainnetResult.every(n => n.isTestnet === false)).toBe(true)
        expect(testnetResult.every(n => n.isTestnet === true)).toBe(true)
      })

      it('should maintain order based on enabledChainIds', () => {
        const state = createMockState({
          network: {
            customNetworks: {},
            enabledChainIds: [43114, 1],
            disabledLastTransactedChainIds: [],
            active: 43114
          }
        } as Partial<RootState>)

        const result = selectEnabledNetworksByTestnet(false)(state)

        if (result.length >= 2) {
          expect(result[0]!.chainId).toBe(43114)
          expect(result[1]!.chainId).toBe(1)
        }
      })

      it('should return empty array when no networks match', () => {
        const state = createMockState({
          network: {
            customNetworks: {},
            enabledChainIds: [],
            disabledLastTransactedChainIds: [],
            active: 0
          }
        } as Partial<RootState>)

        const result = selectEnabledNetworksByTestnet(false)(state)
        expect(result).toEqual([])
      })
    })
  })
  describe('network reducer', () => {
    const initialState: NetworkState = {
      customNetworks: {},
      enabledChainIds: [
        ChainsSDKChainId.AVALANCHE_MAINNET_ID,
        ChainsSDKChainId.ETHEREUM_HOMESTEAD
      ],
      disabledLastTransactedChainIds: [],
      active: noActiveNetwork
    }

    describe('setActive', () => {
      it('should set active network chainId', () => {
        const result = networkReducer(initialState, setActive(43114))

        expect(result.active).toBe(43114)
      })

      it('should update active network from one to another', () => {
        const stateWithActive = { ...initialState, active: 1 }
        const result = networkReducer(stateWithActive, setActive(43114))

        expect(result.active).toBe(43114)
      })
    })

    describe('toggleEnabledChainId', () => {
      it('should add chainId when not present', () => {
        const result = networkReducer(initialState, toggleEnabledChainId(8453))

        expect(result.enabledChainIds).toContain(8453)
        expect(result.enabledChainIds).toHaveLength(3)
      })

      it('should remove chainId when present', () => {
        // Use a non-always-enabled chainId (Base mainnet)
        const stateWithBase = {
          ...initialState,
          enabledChainIds: [...initialState.enabledChainIds, 8453]
        }
        const result = networkReducer(stateWithBase, toggleEnabledChainId(8453))

        expect(result.enabledChainIds).not.toContain(8453)
        expect(result.enabledChainIds).toHaveLength(2)
      })

      it('should not remove chainId if it is always enabled', () => {
        const result = networkReducer(
          initialState,
          toggleEnabledChainId(ChainsSDKChainId.AVALANCHE_MAINNET_ID)
        )

        // Should still contain Avalanche Mainnet (always enabled)
        expect(result.enabledChainIds).toContain(
          ChainsSDKChainId.AVALANCHE_MAINNET_ID
        )
        expect(result.enabledChainIds).toHaveLength(2)
      })

      it('should not remove Bitcoin chainId (always enabled)', () => {
        const stateWithBitcoin = {
          ...initialState,
          enabledChainIds: [
            ...initialState.enabledChainIds,
            ChainsSDKChainId.BITCOIN
          ]
        }
        const result = networkReducer(
          stateWithBitcoin,
          toggleEnabledChainId(ChainsSDKChainId.BITCOIN)
        )

        expect(result.enabledChainIds).toContain(ChainsSDKChainId.BITCOIN)
      })
    })

    describe('toggleDisabledLastTransactedChainId', () => {
      it('should add chainId to disabled list when not present', () => {
        const result = networkReducer(
          initialState,
          toggleDisabledLastTransactedChainId(8453)
        )

        expect(result.disabledLastTransactedChainIds).toContain(8453)
        expect(result.disabledLastTransactedChainIds).toHaveLength(1)
      })

      it('should remove chainId from disabled list when present', () => {
        const stateWithDisabled = {
          ...initialState,
          disabledLastTransactedChainIds: [8453]
        }
        const result = networkReducer(
          stateWithDisabled,
          toggleDisabledLastTransactedChainId(8453)
        )

        expect(result.disabledLastTransactedChainIds).not.toContain(8453)
        expect(result.disabledLastTransactedChainIds).toHaveLength(0)
      })

      it('should not remove always enabled chainIds from disabled list', () => {
        const stateWithDisabled = {
          ...initialState,
          disabledLastTransactedChainIds: [
            ChainsSDKChainId.AVALANCHE_MAINNET_ID
          ]
        }
        const result = networkReducer(
          stateWithDisabled,
          toggleDisabledLastTransactedChainId(
            ChainsSDKChainId.AVALANCHE_MAINNET_ID
          )
        )

        // Should still be in the disabled list
        expect(result.disabledLastTransactedChainIds).toContain(
          ChainsSDKChainId.AVALANCHE_MAINNET_ID
        )
      })
    })

    describe('addCustomNetwork', () => {
      it('should add custom network', () => {
        const customNetwork: Network = {
          chainId: 99999,
          chainName: 'Custom Network',
          isTestnet: false,
          vmName: NetworkVMType.EVM,
          networkToken: {
            name: 'CUSTOM',
            symbol: 'CUST',
            description: 'Custom Token',
            decimals: 18,
            logoUri: ''
          },
          rpcUrl: 'https://custom.network',
          explorerUrl: 'https://explorer.custom.network',
          logoUri: ''
        }

        const result = networkReducer(
          initialState,
          addCustomNetwork(customNetwork)
        )

        expect(result.customNetworks[99999]).toEqual(customNetwork)
      })

      it('should replace existing custom network with same chainId', () => {
        const network1: Network = {
          chainId: 99999,
          chainName: 'Network 1',
          isTestnet: false,
          vmName: NetworkVMType.EVM,
          networkToken: {
            name: 'NET1',
            symbol: 'N1',
            description: 'Network 1',
            decimals: 18,
            logoUri: ''
          },
          rpcUrl: 'https://network1.com',
          explorerUrl: 'https://explorer1.com',
          logoUri: ''
        }

        const network2: Network = {
          ...network1,
          chainName: 'Network 2'
        }

        const stateWithNetwork1 = networkReducer(
          initialState,
          addCustomNetwork(network1)
        )
        const result = networkReducer(
          stateWithNetwork1,
          addCustomNetwork(network2)
        )

        expect(result.customNetworks[99999]).toEqual(network2)
        expect(result.customNetworks[99999]!.chainName).toBe('Network 2')
      })
    })

    describe('updateCustomNetwork', () => {
      it('should update custom network with same chainId', () => {
        const originalNetwork: Network = {
          chainId: 99999,
          chainName: 'Original',
          isTestnet: false,
          vmName: NetworkVMType.EVM,
          networkToken: {
            name: 'ORIG',
            symbol: 'ORG',
            description: 'Original',
            decimals: 18,
            logoUri: ''
          },
          rpcUrl: 'https://original.com',
          explorerUrl: 'https://explorer.original.com',
          logoUri: ''
        }

        const updatedNetwork: Network = {
          ...originalNetwork,
          chainName: 'Updated'
        }

        const stateWithNetwork = {
          ...initialState,
          customNetworks: { 99999: originalNetwork }
        }

        const result = networkReducer(
          stateWithNetwork,
          updateCustomNetwork({ chainId: 99999, network: updatedNetwork })
        )

        expect(result.customNetworks[99999]!.chainName).toBe('Updated')
      })

      it('should handle chainId change', () => {
        const originalNetwork: Network = {
          chainId: 99999,
          chainName: 'Original',
          isTestnet: false,
          vmName: NetworkVMType.EVM,
          networkToken: {
            name: 'ORIG',
            symbol: 'ORG',
            description: 'Original',
            decimals: 18,
            logoUri: ''
          },
          rpcUrl: 'https://original.com',
          explorerUrl: 'https://explorer.original.com',
          logoUri: ''
        }

        const updatedNetwork: Network = {
          ...originalNetwork,
          chainId: 88888
        }

        const stateWithNetwork = {
          ...initialState,
          customNetworks: { 99999: originalNetwork }
        }

        const result = networkReducer(
          stateWithNetwork,
          updateCustomNetwork({ chainId: 99999, network: updatedNetwork })
        )

        expect(result.customNetworks[99999]).toBeUndefined()
        expect(result.customNetworks[88888]).toEqual(updatedNetwork)
      })
    })

    describe('removeCustomNetwork', () => {
      it('should remove custom network', () => {
        const customNetwork: Network = {
          chainId: 99999,
          chainName: 'Custom',
          isTestnet: false,
          vmName: NetworkVMType.EVM,
          networkToken: {
            name: 'CUST',
            symbol: 'CST',
            description: 'Custom',
            decimals: 18,
            logoUri: ''
          },
          rpcUrl: 'https://custom.com',
          explorerUrl: 'https://explorer.custom.com',
          logoUri: ''
        }

        const stateWithNetwork = {
          ...initialState,
          customNetworks: { 99999: customNetwork }
        }

        const result = networkReducer(
          stateWithNetwork,
          removeCustomNetwork(99999)
        )

        expect(result.customNetworks[99999]).toBeUndefined()
      })

      it('should remove chainId from enabledChainIds when removing custom network', () => {
        const customNetwork: Network = {
          chainId: 99999,
          chainName: 'Custom',
          isTestnet: false,
          vmName: NetworkVMType.EVM,
          networkToken: {
            name: 'CUST',
            symbol: 'CST',
            description: 'Custom',
            decimals: 18,
            logoUri: ''
          },
          rpcUrl: 'https://custom.com',
          explorerUrl: 'https://explorer.custom.com',
          logoUri: ''
        }

        const stateWithNetwork = {
          ...initialState,
          customNetworks: { 99999: customNetwork },
          enabledChainIds: [...initialState.enabledChainIds, 99999]
        }

        const result = networkReducer(
          stateWithNetwork,
          removeCustomNetwork(99999)
        )

        expect(result.customNetworks[99999]).toBeUndefined()
        expect(result.enabledChainIds).not.toContain(99999)
      })
    })

    describe('enableL2ChainIds', () => {
      it('should add all default L2 chain IDs', () => {
        const result = networkReducer(initialState, enableL2ChainIds())

        // Should contain all default L2 chains
        defaultEnabledL2ChainIds.forEach(chainId => {
          expect(result.enabledChainIds).toContain(chainId)
        })
      })

      it('should not duplicate already enabled L2 chain IDs', () => {
        const stateWithSomeL2 = {
          ...initialState,
          enabledChainIds: [...initialState.enabledChainIds, 42161] // Arbitrum One
        }

        const result = networkReducer(stateWithSomeL2, enableL2ChainIds())

        // Count occurrences of 42161
        const arbitrumCount = result.enabledChainIds.filter(
          id => id === 42161
        ).length
        expect(arbitrumCount).toBe(1)
      })
    })

    describe('always enabled chainIds', () => {
      it('should not allow toggling off always enabled chains', () => {
        alwaysEnabledChainIds.forEach(chainId => {
          const stateWithChain = {
            ...initialState,
            enabledChainIds: [...initialState.enabledChainIds, chainId]
          }

          const result = networkReducer(
            stateWithChain,
            toggleEnabledChainId(chainId)
          )

          expect(result.enabledChainIds).toContain(chainId)
        })
      })
    })
  })
})
