import { renderHook, act } from '@testing-library/react-hooks'
import { useSelector, useDispatch, useStore } from 'react-redux'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { RpcMethod } from 'store/rpc/types'
import RNWebView from 'react-native-webview'
import {
  selectAllNetworks,
  selectActiveNetwork,
  setActive
} from 'store/network/slice'
import { selectTabChainId, setTabChainId } from 'store/browser/slices/tabs'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ModuleErrors, VmModuleErrors } from 'vmModule/errors'
import {
  EIP1193_USER_REJECTED_CODE,
  JSON_RPC_INTERNAL_ERROR_CODE,
  USER_REJECTED_REQUEST_MESSAGE
} from './injectedProvider/errors'
import { useEvmInjectedProvider } from './useEvmInjectedProvider'

// Read-only RPC now routes through the VM module (CP-14384). Mock the module
// loader + onRpcRequest so the read-only path can be asserted without a network.
const mockOnRpcRequest = jest.fn()
const mockLoadModule = jest.fn(async (..._args: unknown[]) => ({
  onRpcRequest: mockOnRpcRequest
}))
jest.mock('vmModule/ModuleManager', () => ({
  __esModule: true,
  default: {
    loadModule: (...args: unknown[]) => mockLoadModule(...args)
  }
}))
jest.mock('vmModule/utils/mapToVmNetwork', () => ({
  mapToVmNetwork: (network: unknown) => network
}))

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
  useStore: jest.fn()
}))

jest.mock('store/network/slice', () => ({
  selectAllNetworks: jest.fn(),
  selectActiveNetwork: jest.fn(),
  setActive: jest.fn((chainId: number) => ({
    type: 'network/setActive',
    payload: chainId
  }))
}))

jest.mock('store/browser/slices/tabs', () => ({
  selectTabChainId: jest.fn(() => jest.fn(() => undefined)),
  setTabChainId: jest.fn((payload: { tabId: string; chainId: number }) => ({
    type: 'browser/tabs/setTabChainId',
    payload
  })),
  clearTabChainId: jest.fn((payload: { tabId: string }) => ({
    type: 'browser/tabs/clearTabChainId',
    payload
  }))
}))

const mockCreateInAppRequest = jest.fn()
jest.mock('store/rpc/utils/createInAppRequest', () => ({
  createInAppRequest: (...args: unknown[]) => mockCreateInAppRequest(...args)
}))

jest.mock('utils/caip2ChainIds', () => ({
  getEvmCaip2ChainId: (chainId: number) => `eip155:${chainId}`
}))

jest.mock('./evmProviderShim', () => ({
  buildEvmProviderShim: jest.fn(
    ({ chainId }: { chainId: string }) => `SHIM(${chainId})`
  )
}))

jest.mock('expo-router', () => ({
  router: {
    canGoBack: jest.fn(() => false),
    back: jest.fn(),
    navigate: jest.fn()
  }
}))

jest.mock('vmModule/ApprovalController/ApprovalController', () => ({
  approvalController: {
    handleGoBackIfNeeded: jest.fn(),
    isLedgerSigningInProgress: jest.fn()
  }
}))

jest.mock('./getInjectedProviderUuid', () => ({
  getInjectedProviderUuid: () => 'test-uuid-1234'
}))

const mockInjectJavaScript = jest.fn()
const mockWebViewRef = {
  current: { injectJavaScript: mockInjectJavaScript }
} as unknown as React.RefObject<RNWebView | null>

const mockDispatch = jest.fn()

const mockActiveAccount = {
  addressC: '0xTestAddress1234567890'
}

const mockActiveNetwork = {
  vmName: NetworkVMType.EVM,
  chainId: 43114,
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
}

const mockAllNetworks = {
  43114: mockActiveNetwork,
  1: { ...mockActiveNetwork, chainId: 1 }
}

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>

const mockStore = {
  getState: () => ({ permissions: { grants: {} } }),
  dispatch: jest.fn(),
  subscribe: jest.fn(() => () => undefined)
} as unknown as ReturnType<typeof useStore>

// Signing requires the resolved signer account to be granted for the origin.
// Signing tests use this to grant the default active account for their origin.
const grantStoreForOrigin = (origin: string): ReturnType<typeof useStore> =>
  ({
    getState: () => ({
      permissions: {
        grants: { [origin]: { [mockActiveAccount.addressC]: ['EVM'] } }
      }
    }),
    dispatch: jest.fn(),
    subscribe: jest.fn(() => () => undefined)
  } as unknown as ReturnType<typeof useStore>)

function setupMocks(
  overrides: {
    account?: typeof mockActiveAccount | null
    network?: typeof mockActiveNetwork
    allNetworks?: Record<number, unknown>
    developerMode?: boolean
    tabChainId?: number
  } = {}
): void {
  const account =
    overrides.account === undefined ? mockActiveAccount : overrides.account
  const network = overrides.network ?? mockActiveNetwork
  const allNetworks = overrides.allNetworks ?? mockAllNetworks
  const developerMode = overrides.developerMode ?? false
  const tabChainId = overrides.tabChainId

  const mockTabChainIdSelector = jest.fn(() => tabChainId)
  ;(selectTabChainId as jest.Mock).mockReturnValue(mockTabChainIdSelector)

  // requestReadOnly resolves networks via selectAllNetworks(store.getState())
  // (direct call, not useSelector), so the mock must return the map directly.
  ;(selectAllNetworks as jest.Mock).mockReturnValue(allNetworks)

  mockUseSelector.mockImplementation(
    (selector: (state: unknown) => unknown) => {
      if (selector === (selectAllNetworks as unknown)) return allNetworks
      if (selector === (selectActiveNetwork as unknown)) return network
      if (selector === (selectIsDeveloperMode as unknown)) return developerMode
      if (selector === mockTabChainIdSelector) return tabChainId
      const selectorStr = selector.toString()
      if (
        selectorStr.includes('activeAccount') ||
        selectorStr.includes('Account')
      )
        return account
      return undefined
    }
  )
}

// Wraps renderHook and seeds a native origin by default. Tests that explicitly
// want the no-origin path pass an empty string: `renderProvider('')`.
function renderProvider(url = 'https://example.com') {
  const hookReturn = renderHook(() =>
    useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
  )
  if (url) {
    act(() => {
      hookReturn.result.current.handleCommittedUrl(url)
    })
  }
  return hookReturn
}

describe('useEvmInjectedProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDispatch.mockReturnValue(mockDispatch)
    mockUseStore.mockReturnValue(mockStore)
    // Default read-only path: module loads and resolves a result.
    mockLoadModule.mockResolvedValue({ onRpcRequest: mockOnRpcRequest })
    mockOnRpcRequest.mockResolvedValue({ result: '0x0' })
    setupMocks()
  })

  describe('providerShimJs', () => {
    it('generates shim with active network chain', () => {
      const { result } = renderProvider()
      expect(result.current.providerShimJs).toBe('SHIM(0xa86a)')
    })

    it('uses fallback chain ID for non-EVM networks', () => {
      setupMocks({
        network: { ...mockActiveNetwork, vmName: NetworkVMType.BITCOIN }
      })
      const { result } = renderProvider()
      expect(result.current.providerShimJs).toBe('SHIM(0x1)')
    })

    it('still generates shim when no active account', () => {
      setupMocks({ account: null })
      const { result } = renderProvider()
      expect(result.current.providerShimJs).toBe('SHIM(0xa86a)')
    })

    it('is built once per tab — a wallet_switchEthereumChain (tabChainId change) does NOT rebuild it (CP-14615)', () => {
      // Rebuilding providerShimJs changes the WebView's
      // injectedJavaScriptBeforeContentLoaded prop, which makes react-native-webview
      // call resetupScripts and silently drop the switch's own response injection —
      // the dApp's switchChain promise then hangs forever (endless spinner).
      setupMocks({ tabChainId: undefined })
      const { result, rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      expect(result.current.providerShimJs).toBe('SHIM(0xa86a)')

      // The tab gets pinned to Ethereum by a switch; the shim must stay identical.
      setupMocks({ tabChainId: 1 })
      rerender()
      expect(result.current.providerShimJs).toBe('SHIM(0xa86a)')
    })
  })

  describe('chain re-assert on committed URL (CP-14615 Part B)', () => {
    it('re-asserts the live EVM chain via __coreProviderReassertChain on a commit', () => {
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      mockInjectJavaScript.mockClear()
      act(() => {
        result.current.handleCommittedUrl('https://example.com')
      })
      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderReassertChain('0xa86a')")
      )
    })

    it('does NOT re-assert when the resolved live chain is non-EVM', () => {
      const btc = {
        vmName: NetworkVMType.BITCOIN,
        chainId: 99999,
        rpcUrl: 'https://btc.example'
      }
      setupMocks({
        network: btc,
        allNetworks: { ...mockAllNetworks, 99999: btc }
      })
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      mockInjectJavaScript.mockClear()
      act(() => {
        result.current.handleCommittedUrl('https://example.com')
      })
      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining('__coreProviderReassertChain')
      )
    })
  })

  describe('sendResponse', () => {
    it('injects __coreProviderRespond with result', () => {
      const { result } = renderProvider()

      act(() => {
        result.current.emitEvent('chainChanged', '0x1')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining('__coreProviderEmit')
      )
    })
  })

  describe('emitEvent', () => {
    it('injects __coreProviderEmit with event name and data', () => {
      const { result } = renderProvider()

      act(() => {
        result.current.emitEvent('chainChanged', '0x1')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        'window.__coreProviderEmit(\'chainChanged\', "0x1"); true;'
      )
    })

    it('injects accountsChanged with array data', () => {
      const { result } = renderProvider()

      act(() => {
        result.current.emitEvent('accountsChanged', ['0xNewAddr'])
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        'window.__coreProviderEmit(\'accountsChanged\', ["0xNewAddr"]); true;'
      )
    })
  })

  describe('handleProviderMessage', () => {
    it('ignores invalid JSON payload', () => {
      const { result } = renderProvider()
      // The initial commit primes _accounts; isolate the message under test.
      mockInjectJavaScript.mockClear()

      act(() => {
        result.current.handleProviderMessage('not-json')
      })

      expect(mockInjectJavaScript).not.toHaveBeenCalled()
    })

    describe('wallet_switchEthereumChain', () => {
      it('auto-approves, dispatches setTabChainId for the tab, and responds null', async () => {
        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        await act(async () => {
          result.current.handleProviderMessage(
            JSON.stringify({
              id: 1,
              request: {
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x1' }]
              }
            })
          )
        })

        expect(mockDispatch).toHaveBeenCalledWith(
          setTabChainId({ tabId: 'test-tab-id', chainId: 1 })
        )
        // chainChanged is emitted by the shim, not by native
        expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
          expect.stringContaining("__coreProviderEmit('chainChanged'")
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('__coreProviderRespond(1, null, null)')
        )
      })

      it('uses browser chain for signing after wallet_switchEthereumChain', async () => {
        const mockSignFn = jest.fn().mockResolvedValue('0xSig')
        mockCreateInAppRequest.mockReturnValue(mockSignFn)
        // Signing requires the active account granted for the origin.
        mockUseStore.mockReturnValue(grantStoreForOrigin('https://example.com'))

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        // Switch browser to chain 1 (auto-approved)
        await act(async () => {
          result.current.handleProviderMessage(
            JSON.stringify({
              id: 1,
              request: {
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x1' }]
              }
            })
          )
        })

        // Sign — should use browser chain 1, not global active 43114
        await act(async () => {
          result.current.handleProviderMessage(
            JSON.stringify({
              id: 2,
              request: { method: 'personal_sign', params: ['0xMsg', '0xAddr'] }
            })
          )
        })

        expect(mockSignFn).toHaveBeenCalledWith(
          expect.objectContaining({ chainId: 'eip155:1' })
        )
      })

      it('routes read-only methods to the browser chain after wallet_switchEthereumChain', async () => {
        mockOnRpcRequest.mockResolvedValue({ result: '0x1' })

        setupMocks({
          allNetworks: {
            43114: {
              ...mockActiveNetwork,
              chainId: 43114,
              rpcUrl: 'https://avax.rpc'
            },
            1: { ...mockActiveNetwork, chainId: 1, rpcUrl: 'https://eth.rpc' }
          }
        })

        const { result } = renderProvider()

        // Switch browser to chain 1 (auto-approved)
        await act(async () => {
          result.current.handleProviderMessage(
            JSON.stringify({
              id: 1,
              request: {
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x1' }]
              }
            })
          )
        })

        // Read-only call — should target chain 1 (the per-tab browser chain),
        // not the wallet's active Avalanche chain.
        await act(async () => {
          result.current.handleProviderMessage(
            JSON.stringify({
              id: 2,
              request: { method: 'eth_blockNumber', params: [] }
            })
          )
        })

        expect(mockLoadModule).toHaveBeenLastCalledWith(
          'eip155:1',
          'eth_blockNumber'
        )
        expect(mockOnRpcRequest).toHaveBeenCalledWith(
          expect.objectContaining({ chainId: 'eip155:1' }),
          expect.objectContaining({ chainId: 1, rpcUrl: 'https://eth.rpc' })
        )
      })

      it('returns null immediately when requested chain is already active', () => {
        const { result } = renderProvider()

        // 43114 is the active chain
        const payload = JSON.stringify({
          id: 2,
          request: {
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xa86a' }]
          }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockDispatch).not.toHaveBeenCalledWith(
          setTabChainId({ tabId: 'test-tab-id', chainId: 43114 })
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('__coreProviderRespond(2, null, null)')
        )
      })

      it('returns error 4902 when chain is not in wallet (shim no-rollback prevents wagmi re-trigger loop)', () => {
        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 3,
          request: {
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x999' }] // chainId 2457, not in mockAllNetworks
          }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockDispatch).not.toHaveBeenCalledWith(
          expect.objectContaining({ type: 'browser/tabs/setTabChainId' })
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":4902')
        )
      })

      it('returns error when chainId param is missing', () => {
        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 4,
          request: {
            method: 'wallet_switchEthereumChain',
            params: [{}]
          }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32602')
        )
      })
    })

    describe('wallet_addEthereumChain', () => {
      it('routes through createInAppRequest, switches to the added chain, and responds null on success', async () => {
        const mockRequest = jest.fn().mockResolvedValue(null)
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        const payload = JSON.stringify({
          id: 5,
          request: {
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0xaa36a7', chainName: 'Sepolia' }]
          }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockCreateInAppRequest).toHaveBeenCalledWith(
          mockDispatch,
          expect.any(Function)
        )
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0xaa36a7', chainName: 'Sepolia' }]
          })
        )
        // Per EIP-3085: must NOT dispatch global setActive — setTabChainId scopes to this tab only
        expect(setActive).not.toHaveBeenCalled()
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining(
            '__coreProviderEmit(\'chainChanged\', "0xaa36a7")'
          )
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('__coreProviderRespond(5, null, null)')
        )
      })

      it('does not emit chainChanged before approval for wallet_addEthereumChain', async () => {
        // Aave crash root cause: emitting chainChanged BEFORE approval caused wagmi/Aave
        // to re-render with an inconsistent state, crashing the page.
        // chainChanged must only fire AFTER the user approves.
        let chainChangedEmittedBeforeApproval = false

        const mockRequest = jest.fn().mockImplementation(async () => {
          chainChangedEmittedBeforeApproval =
            mockInjectJavaScript.mock.calls.some(call =>
              call[0].includes("__coreProviderEmit('chainChanged'")
            )
          return null
        })
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        await act(async () => {
          result.current.handleProviderMessage(
            JSON.stringify({
              id: 98,
              request: {
                method: 'wallet_addEthereumChain',
                params: [
                  { chainId: '0xaa36a7', rpcUrls: ['https://rpc.sepolia.dev'] }
                ]
              }
            })
          )
        })

        expect(chainChangedEmittedBeforeApproval).toBe(false)
      })

      it('does not emit chainChanged when wallet_addEthereumChain is rejected', async () => {
        const mockRequest = jest.fn().mockRejectedValue({
          code: EIP1193_USER_REJECTED_CODE,
          message: USER_REJECTED_REQUEST_MESSAGE
        })
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        await act(async () => {
          result.current.handleProviderMessage(
            JSON.stringify({
              id: 99,
              request: {
                method: 'wallet_addEthereumChain',
                params: [
                  { chainId: '0xaa36a7', rpcUrls: ['https://rpc.sepolia.dev'] }
                ]
              }
            })
          )
        })

        const chainChangedCalls = mockInjectJavaScript.mock.calls.filter(call =>
          call[0].includes("__coreProviderEmit('chainChanged'")
        )
        expect(chainChangedCalls).toHaveLength(0)
      })

      it('responds with error when user rejects', async () => {
        const mockRequest = jest.fn().mockRejectedValue({
          code: EIP1193_USER_REJECTED_CODE,
          message: USER_REJECTED_REQUEST_MESSAGE
        })
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        const payload = JSON.stringify({
          id: 6,
          request: {
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0xaa36a7', chainName: 'Sepolia' }]
          }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining(`"code":${EIP1193_USER_REJECTED_CODE}`)
        )
      })
    })

    describe('wallet_revokePermissions', () => {
      it('emits accountsChanged (not disconnect) then responds null', () => {
        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 7,
          request: {
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining("__coreProviderEmit('accountsChanged', [])")
        )
        // Per EIP-1193, 'disconnect' means network loss — not user revocation.
        // Emitting it causes wagmi to mark the provider as offline.
        expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
          expect.stringContaining("__coreProviderEmit('disconnect'")
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('__coreProviderRespond(7, null, null)')
        )
      })
    })

    describe('wallet_watchAsset', () => {
      function makeWatchAssetPayload(id: number, params: unknown): string {
        return JSON.stringify({
          id,
          request: { method: 'wallet_watchAsset', params }
        })
      }

      it('routes through createInAppRequest and responds true on approval', async () => {
        const mockRequest = jest.fn().mockResolvedValue(true)
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        await act(async () => {
          result.current.handleProviderMessage(
            makeWatchAssetPayload(1, [
              {
                type: 'ERC20',
                options: { address: '0xToken', symbol: 'TKN', decimals: 18 }
              }
            ])
          )
        })

        expect(mockCreateInAppRequest).toHaveBeenCalledWith(
          mockDispatch,
          expect.any(Function)
        )
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'wallet_watchAsset',
            chainId: `eip155:${mockActiveNetwork.chainId}`
          })
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('__coreProviderRespond(1, null, true)')
        )
      })

      it('normalizes object-form params to array before passing to handler', async () => {
        const mockRequest = jest.fn().mockResolvedValue(true)
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        await act(async () => {
          result.current.handleProviderMessage(
            makeWatchAssetPayload(2, {
              type: 'ERC20',
              options: { address: '0xToken', symbol: 'TKN', decimals: 18 }
            })
          )
        })

        const passedParams = mockRequest.mock.calls[0][0].params
        expect(Array.isArray(passedParams)).toBe(true)
      })

      it('responds false (not an error) when user rejects, per EIP-747', async () => {
        const mockRequest = jest.fn().mockRejectedValue({
          code: EIP1193_USER_REJECTED_CODE,
          message: USER_REJECTED_REQUEST_MESSAGE
        })
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        await act(async () => {
          result.current.handleProviderMessage(
            makeWatchAssetPayload(3, [
              {
                type: 'ERC20',
                options: { address: '0xToken', symbol: 'TKN', decimals: 18 }
              }
            ])
          )
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('__coreProviderRespond(3, null, false)')
        )
        // Must not send an error — EIP-747 rejection is not an error
        expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
          expect.stringContaining('"code"')
        )
      })
    })

    describe('signing methods', () => {
      const signingMethods = [
        { dappMethod: 'personal_sign', rpcMethod: RpcMethod.PERSONAL_SIGN },
        {
          dappMethod: 'eth_sendTransaction',
          rpcMethod: RpcMethod.ETH_SEND_TRANSACTION
        },
        { dappMethod: 'eth_sign', rpcMethod: RpcMethod.ETH_SIGN },
        {
          dappMethod: 'eth_signTypedData',
          rpcMethod: RpcMethod.SIGN_TYPED_DATA
        },
        {
          dappMethod: 'eth_signTypedData_v1',
          rpcMethod: RpcMethod.SIGN_TYPED_DATA_V1
        },
        {
          dappMethod: 'eth_signTypedData_v3',
          rpcMethod: RpcMethod.SIGN_TYPED_DATA_V3
        },
        {
          dappMethod: 'eth_signTypedData_v4',
          rpcMethod: RpcMethod.SIGN_TYPED_DATA_V4
        }
      ]

      // The signing gate requires the signer account to be granted for the
      // origin; these tests render at https://example.com as the active account.
      beforeEach(() => {
        mockUseStore.mockReturnValue(grantStoreForOrigin('https://example.com'))
      })

      it.each(signingMethods)(
        'dispatches $dappMethod through createInAppRequest',
        async ({ dappMethod, rpcMethod }) => {
          const mockRequest = jest.fn().mockResolvedValue('0xSignature')
          mockCreateInAppRequest.mockReturnValue(mockRequest)

          const { result } = renderProvider()

          act(() => {
            result.current.handleCommittedUrl('https://example.com')
          })

          const payload = JSON.stringify({
            id: 10,
            request: {
              method: dappMethod,
              params: ['param1', 'param2']
            }
          })

          await act(async () => {
            result.current.handleProviderMessage(payload)
          })

          expect(mockCreateInAppRequest).toHaveBeenCalledWith(
            mockDispatch,
            expect.any(Function)
          )
          expect(mockRequest).toHaveBeenCalledWith(
            expect.objectContaining({
              method: rpcMethod,
              params: ['param1', 'param2'],
              chainId: 'eip155:43114',
              peerMeta: expect.objectContaining({
                url: 'https://example.com'
              }),
              signal: expect.any(AbortSignal)
            })
          )
        }
      )

      it('derives peerMeta.name from the native URL hostname, not from page-supplied domain_metadata', async () => {
        const mockRequest = jest.fn().mockResolvedValue('0xSig')
        mockCreateInAppRequest.mockReturnValue(mockRequest)
        // Signing requires the active account granted for the (real) origin.
        mockUseStore.mockReturnValue(
          grantStoreForOrigin('https://malicious.example')
        )

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        // The page is actually loaded from a malicious origin...
        act(() => {
          result.current.handleCommittedUrl('https://malicious.example/path')
        })

        // ...but it tries to spoof its display name via domain_metadata.
        act(() => {
          result.current.handleDomainMetadata(
            JSON.stringify({
              domain: 'core.app',
              name: 'core.app',
              icon: 'https://core.app/favicon.ico',
              url: 'https://core.app/'
            })
          )
        })

        await act(async () => {
          result.current.handleProviderMessage(
            JSON.stringify({
              id: 99,
              request: {
                method: 'personal_sign',
                params: ['0xMessage', '0xAddress']
              }
            })
          )
        })

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            peerMeta: expect.objectContaining({
              name: 'malicious.example',
              url: 'https://malicious.example/path',
              icons: ['https://core.app/favicon.ico']
            })
          })
        )
      })

      it('responds with signature on approval', async () => {
        const mockRequest = jest.fn().mockResolvedValue('0xSignatureResult')
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        const payload = JSON.stringify({
          id: 20,
          request: {
            method: 'personal_sign',
            params: ['0xMessage', '0xAddress']
          }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          'if(window.location.origin==="https://example.com"){window.__coreProviderRespond(20, null, "0xSignatureResult");}true;'
        )
      })

      it('responds with EIP-1193 user-rejected code on user rejection', async () => {
        const mockRequest = jest.fn().mockRejectedValue({
          code: EIP1193_USER_REJECTED_CODE,
          message: USER_REJECTED_REQUEST_MESSAGE
        })
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        const payload = JSON.stringify({
          id: 21,
          request: {
            method: 'personal_sign',
            params: ['0xMessage', '0xAddress']
          }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('__coreProviderRespond(21,')
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining(`"code":${EIP1193_USER_REJECTED_CODE}`)
        )
      })

      it('rejects signing when origin is unavailable', () => {
        const { result } = renderProvider('')

        const payload = JSON.stringify({
          id: 22,
          request: { method: 'eth_sign', params: [] }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":4100')
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('Origin unavailable')
        )
      })

      it('rejects wallet_addEthereumChain when origin is unavailable (no Core attribution)', async () => {
        const mockRequest = jest.fn()
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        const payload = JSON.stringify({
          id: 30,
          request: {
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0x1' }]
          }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        // Must NOT reach the approval pipeline (would otherwise be attributed
        // to CORE_MOBILE_META by generateInAppRequestPayload).
        expect(mockRequest).not.toHaveBeenCalled()
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('Origin unavailable')
        )
      })

      it('rejects wallet_watchAsset when origin is unavailable (no Core attribution)', async () => {
        const mockRequest = jest.fn()
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        const payload = JSON.stringify({
          id: 31,
          request: {
            method: 'wallet_watchAsset',
            params: [{ type: 'ERC20', options: { address: '0x0' } }]
          }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockRequest).not.toHaveBeenCalled()
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('Origin unavailable')
        )
      })

      it('preserves well-formed RPC errors without re-serializing', async () => {
        const mockRequest = jest
          .fn()
          .mockRejectedValue({ code: 4902, message: 'Unrecognized chain ID' })
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        const payload = JSON.stringify({
          id: 23,
          request: { method: 'eth_sign', params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":4902')
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"message":"Unrecognized chain ID"')
        )
      })

      it('serializes unknown errors via serializeError', async () => {
        const mockRequest = jest
          .fn()
          .mockRejectedValue({ message: 'Something went wrong' })
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        const payload = JSON.stringify({
          id: 24,
          request: { method: 'eth_sign', params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('__coreProviderRespond(24,')
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code"')
        )
      })
    })

    describe('read-only methods', () => {
      const readOnlyMethods = [
        'eth_blockNumber',
        'eth_call',
        'eth_estimateGas',
        'eth_gasPrice',
        'eth_getBalance',
        'eth_getBlockByHash',
        'eth_getBlockByNumber',
        'eth_getCode',
        'eth_getLogs',
        'eth_getStorageAt',
        'eth_getTransactionByHash',
        'eth_getTransactionCount',
        'eth_getTransactionReceipt',
        'eth_maxPriorityFeePerGas',
        'eth_feeHistory',
        'web3_clientVersion',
        'web3_sha3',
        'eth_getBlockTransactionCountByHash',
        'eth_getBlockTransactionCountByNumber'
      ]

      it.each(readOnlyMethods)(
        'routes %s through module.onRpcRequest',
        async method => {
          mockOnRpcRequest.mockResolvedValue({ result: '0xABC' })

          const { result } = renderProvider()

          const payload = JSON.stringify({
            id: 100,
            request: { method, params: [] }
          })

          await act(async () => {
            result.current.handleProviderMessage(payload)
          })

          // Loaded by the active chain's caip2 id, validated against the manifest.
          expect(mockLoadModule).toHaveBeenCalledWith('eip155:43114', method)
          expect(mockOnRpcRequest).toHaveBeenCalledWith(
            expect.objectContaining({
              method,
              chainId: 'eip155:43114',
              params: []
            }),
            expect.objectContaining({ chainId: 43114 })
          )
        }
      )

      it('returns RPC result to WebView', async () => {
        mockOnRpcRequest.mockResolvedValue({ result: '0xBalanceValue' })

        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 101,
          request: {
            method: 'eth_getBalance',
            params: ['0x123', 'latest']
          }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining(
            '__coreProviderRespond(101, null, "0xBalanceValue")'
          )
        )
      })

      it('returns RPC error to WebView', async () => {
        const rpcError = { code: -32000, message: 'execution reverted' }
        mockOnRpcRequest.mockResolvedValue({ error: rpcError })

        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 102,
          request: { method: 'eth_call', params: [{}] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32000')
        )
      })

      it('surfaces an internal error when the module call throws', async () => {
        mockOnRpcRequest.mockRejectedValue(new Error('Network error'))

        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 103,
          request: { method: 'eth_blockNumber', params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining(`"code":${JSON_RPC_INTERNAL_ERROR_CODE}`)
        )
      })

      it('returns an internal error and never loads the module when no network is configured for the chain', async () => {
        // The browser/active chain isn't present in the network store (e.g. not
        // yet synced, or removed). requestReadOnly must surface a real internal
        // error up front rather than calling the module with a missing network.
        setupMocks({ allNetworks: {} })

        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 202,
          request: { method: 'eth_blockNumber', params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockLoadModule).not.toHaveBeenCalled()
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining(`"code":${JSON_RPC_INTERNAL_ERROR_CODE}`)
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('No network configured')
        )
      })
    })

    describe('unsupported methods', () => {
      it('returns error -32601 when the module manifest rejects the method', async () => {
        // loadModule throws UNSUPPORTED_METHOD for methods the manifest doesn't
        // permit; the hook maps that to methodNotFound (-32601).
        mockLoadModule.mockRejectedValueOnce(
          new VmModuleErrors({
            name: ModuleErrors.UNSUPPORTED_METHOD,
            message: 'unsupported method'
          })
        )

        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 200,
          request: { method: 'eth_unknownMethod', params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32601')
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('eth_unknownMethod')
        )
      })

      it('returns an internal error (not -32601) when loadModule fails for a non-method reason', async () => {
        // Unsupported chainId / module init failure must surface as a real
        // internal error, not masquerade as methodNotFound.
        mockLoadModule.mockRejectedValueOnce(
          new VmModuleErrors({
            name: ModuleErrors.UNSUPPORTED_CHAIN_ID,
            message: 'unsupported chain'
          })
        )

        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 201,
          request: { method: 'eth_blockNumber', params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32603')
        )
        expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
          expect.stringContaining('"code":-32601')
        )
      })
    })

    describe('null params handling', () => {
      it('defaults params to empty array for signing methods', async () => {
        const mockRequest = jest.fn().mockResolvedValue('0xResult')
        mockCreateInAppRequest.mockReturnValue(mockRequest)
        // Signing requires the active account granted for the origin.
        mockUseStore.mockReturnValue(grantStoreForOrigin('https://example.com'))

        const { result } = renderProvider()

        act(() => {
          result.current.handleCommittedUrl('https://example.com')
        })

        const payload = JSON.stringify({
          id: 300,
          request: { method: 'personal_sign' }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({ params: [] })
        )
      })
    })

    describe('validation and security', () => {
      it('rejects malformed payloads with -32600', () => {
        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 400,
          request: { method: 123 }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32600')
        )
      })

      it('rejects unknown methods with -32601', async () => {
        // Unsupported methods are rejected by the module manifest (loadModule
        // throws UNSUPPORTED_METHOD), which the hook maps to methodNotFound (-32601).
        mockLoadModule.mockRejectedValueOnce(
          new VmModuleErrors({
            name: ModuleErrors.UNSUPPORTED_METHOD,
            message: 'unsupported method'
          })
        )

        const { result } = renderProvider()

        const payload = JSON.stringify({
          id: 401,
          request: { method: 'eth_unknownMethod', params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32601')
        )
      })

      it('exposes handleCommittedUrl', () => {
        const { result } = renderProvider()

        expect(typeof result.current.handleCommittedUrl).toBe('function')
      })
    })
  })

  describe('global active network sync effect', () => {
    it('emits chainChanged with the new hex chainId when the global active network changes on a tab with no persisted chain', () => {
      setupMocks({ network: mockActiveNetwork })
      const { rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      mockInjectJavaScript.mockClear()

      // Simulate a global network change to Ethereum mainnet (chainId 1)
      setupMocks({ network: { ...mockActiveNetwork, chainId: 1 } })
      rerender()

      const chainChangedCalls = mockInjectJavaScript.mock.calls.filter(call =>
        call[0].includes("__coreProviderEmit('chainChanged'")
      )
      expect(chainChangedCalls).toHaveLength(1)
      expect(chainChangedCalls[0][0]).toContain("'chainChanged', '0x1'")
    })

    it('does not emit chainChanged when the global network changes but the tab has a persisted chainId', () => {
      ;(selectTabChainId as jest.Mock).mockReturnValue(jest.fn(() => 1))
      mockUseSelector.mockImplementation(
        (selector: (state: unknown) => unknown) => {
          if (selector === (selectAllNetworks as unknown))
            return mockAllNetworks
          if (selector === (selectActiveNetwork as unknown))
            return mockActiveNetwork
          const tabChainIdSelector = (selectTabChainId as jest.Mock).mock
            .results[0]?.value
          if (selector === tabChainIdSelector) return 1
          const selectorStr = selector.toString()
          if (
            selectorStr.includes('activeAccount') ||
            selectorStr.includes('Account')
          )
            return mockActiveAccount
          return undefined
        }
      )

      const { rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      mockInjectJavaScript.mockClear()

      // Simulate a global network change — tab has persisted chain so should be ignored
      setupMocks({ network: { ...mockActiveNetwork, chainId: 1 } })
      ;(selectTabChainId as jest.Mock).mockReturnValue(jest.fn(() => 1))
      rerender()

      const chainChangedCalls = mockInjectJavaScript.mock.calls.filter(call =>
        call[0].includes("__coreProviderEmit('chainChanged'")
      )
      expect(chainChangedCalls).toHaveLength(0)
    })

    it('does not emit chainChanged when the active network chainId has not actually changed', () => {
      setupMocks({ network: mockActiveNetwork })
      const { rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      mockInjectJavaScript.mockClear()

      // Re-render with the same network — no change
      setupMocks({ network: mockActiveNetwork })
      rerender()

      const chainChangedCalls = mockInjectJavaScript.mock.calls.filter(call =>
        call[0].includes("__coreProviderEmit('chainChanged'")
      )
      expect(chainChangedCalls).toHaveLength(0)
    })

    it('keeps the provider alive (no disconnect, no chainChanged) when the active network is non-EVM (CP-13672)', () => {
      // The injected provider object is shared (window.avalanche ===
      // window.ethereum) and avalanche_* methods are network-independent.
      // Emitting an EIP-1193 disconnect when the wallet's active network goes
      // non-EVM would tell wagmi the whole provider is offline — and it would
      // refuse to auto-reconnect — killing the X/P surface too. Hold the last
      // EVM browser chain instead, and never emit a bogus EVM chainChanged for a
      // non-EVM chainId either.
      setupMocks({ network: mockActiveNetwork })
      const { rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      mockInjectJavaScript.mockClear()

      // Switch the wallet's active network to a non-EVM chain (e.g. Bitcoin).
      setupMocks({
        network: {
          ...mockActiveNetwork,
          chainId: 999,
          vmName: NetworkVMType.BITCOIN
        }
      })
      rerender()

      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('disconnect'")
      )
      const chainChangedCalls = mockInjectJavaScript.mock.calls.filter(call =>
        call[0].includes("__coreProviderEmit('chainChanged'")
      )
      expect(chainChangedCalls).toHaveLength(0)
    })

    it('does NOT disconnect a pinned tab when the active network flips to non-EVM (CP-13671)', () => {
      // Per-tab insulation invariant: a tab that pinned its chain via
      // wallet_switchEthereumChain must ignore wallet-wide network changes —
      // including a flip to a non-EVM chain. This is what makes the per-tab
      // model hold.
      setupMocks({ tabChainId: 1 })
      const { rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      mockInjectJavaScript.mockClear()

      // Wallet flips to a non-EVM chain; the pinned tab must not react.
      setupMocks({
        tabChainId: 1,
        network: {
          ...mockActiveNetwork,
          chainId: 999,
          vmName: NetworkVMType.BITCOIN
        }
      })
      rerender()

      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('disconnect'")
      )
      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('chainChanged'")
      )
    })

    it('does not re-emit chainChanged when returning to the SAME EVM chain after a non-EVM detour (CP-13672)', () => {
      // The provider is kept alive across a non-EVM active network (no disconnect,
      // no cache invalidation), so the EVM browser chain is never lost. Returning
      // to the same EVM chain is therefore a no-op — the dApp was never told its
      // chain changed, so there is nothing to recover and no event to emit.
      setupMocks({ network: mockActiveNetwork })
      const { rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      // Detour through a non-EVM network (provider stays alive, chain retained).
      setupMocks({
        network: {
          ...mockActiveNetwork,
          chainId: 999,
          vmName: NetworkVMType.BITCOIN
        }
      })
      rerender()
      mockInjectJavaScript.mockClear()

      // Return to the SAME EVM chain (43114) we started on.
      setupMocks({ network: mockActiveNetwork })
      rerender()

      const chainChangedCalls = mockInjectJavaScript.mock.calls.filter(call =>
        call[0].includes("__coreProviderEmit('chainChanged'")
      )
      expect(chainChangedCalls).toHaveLength(0)
    })

    it('emits chainChanged when switching to a DIFFERENT EVM chain after a non-EVM detour (CP-13672)', () => {
      // Keeping the provider alive must not freeze chain tracking: a non-EVM
      // detour retains the last EVM chain, but a subsequent switch to a genuinely
      // different EVM chain still fires chainChanged so the dApp follows it.
      setupMocks({ network: mockActiveNetwork })
      const { rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      setupMocks({
        network: {
          ...mockActiveNetwork,
          chainId: 999,
          vmName: NetworkVMType.BITCOIN
        }
      })
      rerender()
      mockInjectJavaScript.mockClear()

      // Switch to a different EVM chain (Ethereum mainnet, 0x1).
      setupMocks({
        network: { ...mockActiveNetwork, chainId: 1, vmName: NetworkVMType.EVM }
      })
      rerender()

      const chainChangedCalls = mockInjectJavaScript.mock.calls.filter(call =>
        call[0].includes("__coreProviderEmit('chainChanged'")
      )
      expect(chainChangedCalls).toHaveLength(1)
      expect(chainChangedCalls[0][0]).toContain("'chainChanged', '0x1'")
    })

    it('clears the per-tab chain pin when developer mode flips (CP-13775)', () => {
      setupMocks({ developerMode: false, tabChainId: 1 })
      const { rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      mockDispatch.mockClear()

      // Toggle testnet/developer mode on.
      setupMocks({ developerMode: true, tabChainId: 1 })
      rerender()

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'browser/tabs/clearTabChainId' })
      )
    })

    it('does not dispatch clearTabChainId on a dev-mode flip when the tab has no pin', () => {
      // Guard against a redundant store update/rerender on every toggle when
      // there's nothing to clear.
      setupMocks({ developerMode: false })
      const { rerender } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      mockDispatch.mockClear()

      setupMocks({ developerMode: true })
      rerender()

      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'browser/tabs/clearTabChainId' })
      )
    })
  })

  describe('handleCommittedUrl origin-change cleanup', () => {
    it('aborts in-flight signing request when navigating cross-origin', async () => {
      const { approvalController: mockApprovalController } = jest.requireMock(
        'vmModule/ApprovalController/ApprovalController'
      )
      ;(mockApprovalController.handleGoBackIfNeeded as jest.Mock).mockClear()

      let capturedSignal: AbortSignal | undefined
      const mockRequest = jest.fn(args => {
        capturedSignal = args.signal
        return new Promise(() => undefined)
      })
      mockCreateInAppRequest.mockReturnValue(mockRequest)
      // Signing requires the active account granted for the origin.
      mockUseStore.mockReturnValue(grantStoreForOrigin('https://uniswap.org'))

      const { result } = renderProvider('https://uniswap.org')

      await act(async () => {
        result.current.handleProviderMessage(
          JSON.stringify({
            id: 99,
            request: { method: 'personal_sign', params: ['0xMsg', '0xAddr'] }
          })
        )
      })

      expect(capturedSignal?.aborted).toBe(false)

      act(() => {
        result.current.handleCommittedUrl('https://opensea.io')
      })

      expect(capturedSignal?.aborted).toBe(true)
      expect(mockApprovalController.handleGoBackIfNeeded).toHaveBeenCalled()
    })

    it('does NOT pop the screen on cross-origin nav while on-device Ledger signing is in progress (CP-14422)', async () => {
      const { approvalController: mockApprovalController } = jest.requireMock(
        'vmModule/ApprovalController/ApprovalController'
      )
      ;(mockApprovalController.handleGoBackIfNeeded as jest.Mock).mockClear()
      // Uncancellable window: a signature is being confirmed on the device.
      ;(
        mockApprovalController.isLedgerSigningInProgress as jest.Mock
      ).mockReturnValueOnce(true)

      let capturedSignal: AbortSignal | undefined
      const mockRequest = jest.fn(args => {
        capturedSignal = args.signal
        return new Promise(() => undefined)
      })
      mockCreateInAppRequest.mockReturnValue(mockRequest)
      mockUseStore.mockReturnValue(grantStoreForOrigin('https://uniswap.org'))

      const { result } = renderProvider('https://uniswap.org')

      await act(async () => {
        result.current.handleProviderMessage(
          JSON.stringify({
            id: 99,
            request: { method: 'personal_sign', params: ['0xMsg', '0xAddr'] }
          })
        )
      })

      act(() => {
        result.current.handleCommittedUrl('https://opensea.io')
      })

      // Settlement still no-ops in the controller for this phase, and the abort
      // still fires — but the review screen must NOT be popped out from under a
      // signature the user is confirming on the device.
      expect(capturedSignal?.aborted).toBe(true)
      expect(mockApprovalController.handleGoBackIfNeeded).not.toHaveBeenCalled()
    })

    it('does NOT abort in-flight request on same-origin navigation (SPA route change)', async () => {
      let capturedSignal: AbortSignal | undefined
      const mockRequest = jest.fn(args => {
        capturedSignal = args.signal
        return new Promise(() => undefined)
      })
      mockCreateInAppRequest.mockReturnValue(mockRequest)
      // Signing requires the active account granted for the origin.
      mockUseStore.mockReturnValue(grantStoreForOrigin('https://uniswap.org'))

      const { result } = renderProvider('https://uniswap.org/swap')

      await act(async () => {
        result.current.handleProviderMessage(
          JSON.stringify({
            id: 99,
            request: { method: 'personal_sign', params: ['0xMsg', '0xAddr'] }
          })
        )
      })

      act(() => {
        // Same origin, different path — mimics a SPA nav_change message
        result.current.handleCommittedUrl('https://uniswap.org/pool')
      })

      expect(capturedSignal?.aborted).toBe(false)
    })

    it('re-primes accountsChanged on same-origin SPA navigation to a new path (CP-13772)', () => {
      // Origin granted to the active account so priming yields a non-empty list.
      mockUseStore.mockReturnValue({
        getState: () => ({
          permissions: {
            grants: {
              'https://uniswap.org': {
                [mockActiveAccount.addressC]: ['EVM']
              }
            }
          }
        }),
        dispatch: jest.fn(),
        subscribe: jest.fn(() => () => undefined)
      } as unknown as ReturnType<typeof useStore>)

      const { result } = renderProvider('https://uniswap.org')
      mockInjectJavaScript.mockClear()

      act(() => {
        // SPA route change within the same origin (e.g. core.app -> /stake).
        result.current.handleCommittedUrl('https://uniswap.org/stake')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining(
          `__coreProviderEmit('accountsChanged', ["${mockActiveAccount.addressC}"]`
        )
      )
    })
  })

  describe('handleDomainMetadata', () => {
    it('stores valid domain metadata', () => {
      const { result } = renderProvider()

      const metadata = {
        domain: 'opensea.io',
        name: 'OpenSea',
        icon: 'https://opensea.io/favicon.ico',
        url: 'https://opensea.io/'
      }

      act(() => {
        result.current.handleDomainMetadata(JSON.stringify(metadata))
      })

      expect(result.current.dappMetadata.current).toEqual(metadata)
    })

    it('handles invalid JSON gracefully', () => {
      const { result } = renderProvider()

      act(() => {
        result.current.handleDomainMetadata('invalid-json')
      })

      expect(result.current.dappMetadata.current).toBeNull()
    })
  })

  describe('handleCommittedUrl primes _accounts', () => {
    const metadata = JSON.stringify({
      domain: 'opensea.io',
      name: 'OpenSea',
      icon: '',
      url: 'https://opensea.io/'
    })

    const withPermission = (addr: string): ReturnType<typeof useStore> =>
      ({
        getState: () => ({
          permissions: {
            grants: {
              'https://opensea.io': {
                [addr]: ['EVM']
              }
            }
          }
        }),
        dispatch: jest.fn(),
        subscribe: jest.fn(() => () => undefined)
      } as unknown as ReturnType<typeof useStore>)

    it('injects accountsChanged([address]) when the committed origin has a grant for the active account', () => {
      mockUseStore.mockReturnValue(withPermission(mockActiveAccount.addressC))
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.handleCommittedUrl('https://opensea.io/')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining(
          `__coreProviderEmit('accountsChanged', ["${mockActiveAccount.addressC}"])`
        )
      )
    })

    it('injects accountsChanged([]) when no grant exists for the committed origin', () => {
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.handleCommittedUrl('https://opensea.io/')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('accountsChanged', [])")
      )
    })

    it('origin-gates the prime emit to the current page origin', () => {
      // The prime injection must be wrapped in a window.location.origin check
      // so a prime racing a cross-origin nav can't leak the previous origin's
      // granted accounts into the next origin's page.
      mockUseStore.mockReturnValue(withPermission(mockActiveAccount.addressC))
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.handleCommittedUrl('https://opensea.io/')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining(
          'if(window.location.origin==="https://opensea.io")'
        )
      )
    })

    it('injects accountsChanged([]) on commit when the active account is NOT granted', () => {
      // Origin granted to a different address than the active account.
      // Priming the granted set here would re-establish a phantom connection
      // the injected signer can't honor, so we emit [] instead (CP-14382).
      mockUseStore.mockReturnValue(withPermission('0xSomeOtherGrantedAddr'))
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.handleCommittedUrl('https://opensea.io/')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('accountsChanged', [])")
      )
    })

    it('primes on first load even when domain_metadata arrived before the URL committed', () => {
      // First-load ordering: the shim posts domain_metadata at the page's
      // DOMContentLoaded, which fires BEFORE the native onLoad commits the
      // URL. The metadata alone must not prime (no trusted origin yet); the
      // later commit must.
      mockUseStore.mockReturnValue(withPermission(mockActiveAccount.addressC))
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.handleDomainMetadata(metadata)
      })

      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('accountsChanged'")
      )

      act(() => {
        result.current.handleCommittedUrl('https://opensea.io/')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining(
          `__coreProviderEmit('accountsChanged', ["${mockActiveAccount.addressC}"])`
        )
      )
    })

    it('does not prime a new document with the previous origin grant (cross-origin nav)', () => {
      // A→B navigation: B's domain_metadata arrives while currentUrlRef still
      // holds A. Priming off that message would inject A's granted account
      // into B's document. It must stay silent until B's URL commits.
      mockUseStore.mockReturnValue(withPermission(mockActiveAccount.addressC))
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.handleCommittedUrl('https://opensea.io/')
      })
      mockInjectJavaScript.mockClear()

      act(() => {
        result.current.handleDomainMetadata(
          JSON.stringify({
            domain: 'evil.example',
            name: 'Evil',
            icon: '',
            url: 'https://evil.example/'
          })
        )
      })

      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('accountsChanged'")
      )

      act(() => {
        result.current.handleCommittedUrl('https://evil.example/')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('accountsChanged', [])")
      )
    })

    it('does not inject accountsChanged when origin is missing', () => {
      // Committing an empty URL leaves currentUrlRef origin '' so the prime
      // guard early-returns.
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      mockInjectJavaScript.mockClear()

      act(() => {
        result.current.handleCommittedUrl('')
      })

      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('accountsChanged'")
      )
    })

    it('does not inject accountsChanged when there is no active account', () => {
      setupMocks({ account: null })
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.handleCommittedUrl('https://opensea.io/')
      })

      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('accountsChanged'")
      )
    })
  })

  describe('active-account switch propagation (CP-14382)', () => {
    const ORIGIN = 'https://opensea.io/'
    const A = mockActiveAccount.addressC
    const B = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    const C = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'
    const accountA = mockActiveAccount
    const accountB = { ...mockActiveAccount, addressC: B }
    const accountC = { ...mockActiveAccount, addressC: C }

    // A store whose grants for opensea.io cover exactly `addrs` (EVM).
    const storeGranting = (addrs: string[]): ReturnType<typeof useStore> =>
      ({
        getState: () => ({
          permissions: {
            grants: {
              'https://opensea.io': Object.fromEntries(
                addrs.map(addr => [addr, ['EVM']])
              )
            }
          }
        }),
        dispatch: jest.fn(),
        subscribe: jest.fn(() => () => undefined)
      } as unknown as ReturnType<typeof useStore>)

    it('emits [newActive, ...others] when switching to a granted account', () => {
      mockUseStore.mockReturnValue(storeGranting([A, B]))
      setupMocks({ account: accountA })
      const { rerender, result } = renderProvider()
      act(() => result.current.handleCommittedUrl(ORIGIN))
      mockInjectJavaScript.mockClear()

      setupMocks({ account: accountB })
      act(() => rerender())

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining(`'accountsChanged', ["${B}","${A}"]`)
      )
    })

    it('origin-gates the accountsChanged emit to the resolved origin', () => {
      // The injected JS must be wrapped in a window.location.origin check so an
      // account switch racing a cross-origin nav can't leak addresses to a
      // different page (same guard as sendResponse).
      mockUseStore.mockReturnValue(storeGranting([A, B]))
      setupMocks({ account: accountA })
      const { rerender, result } = renderProvider()
      act(() => result.current.handleCommittedUrl(ORIGIN))
      mockInjectJavaScript.mockClear()

      setupMocks({ account: accountB })
      act(() => rerender())

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining(
          'if(window.location.origin==="https://opensea.io")'
        )
      )
    })

    it('emits [] when switching to an ungranted account', () => {
      mockUseStore.mockReturnValue(storeGranting([A, B]))
      setupMocks({ account: accountA })
      const { rerender, result } = renderProvider()
      act(() => result.current.handleCommittedUrl(ORIGIN))
      mockInjectJavaScript.mockClear()

      setupMocks({ account: accountC })
      act(() => rerender())

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("'accountsChanged', []")
      )
    })

    it('re-emits the granted set when switching back from an ungranted account', () => {
      mockUseStore.mockReturnValue(storeGranting([A, B]))
      setupMocks({ account: accountC })
      const { rerender, result } = renderProvider()
      act(() => result.current.handleCommittedUrl(ORIGIN))
      // Switch to ungranted-adjacent path then back to a granted account.
      setupMocks({ account: accountA })
      act(() => rerender())
      mockInjectJavaScript.mockClear()

      setupMocks({ account: accountB })
      act(() => rerender())

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining(`'accountsChanged', ["${B}","${A}"]`)
      )
    })

    it('emits accountsChanged([]) after grants are revoked and the active account switches', () => {
      // Origin starts connected to [A, B]; the first switch advertises that set.
      mockUseStore.mockReturnValue(storeGranting([A, B]))
      setupMocks({ account: accountA })
      const { rerender, result } = renderProvider()
      act(() => result.current.handleCommittedUrl(ORIGIN))
      setupMocks({ account: accountB })
      act(() => rerender())
      mockInjectJavaScript.mockClear()

      // Grants revoked (e.g. via Connected Sites), then the user switches
      // accounts. The dApp's stale _accounts must be cleared with [] rather than
      // left advertising the now-revoked set.
      mockUseStore.mockReturnValue(storeGranting([]))
      setupMocks({ account: accountA })
      act(() => rerender())

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("'accountsChanged', []")
      )
    })

    it('does not re-emit [] for a never-connected origin already primed to []', () => {
      // No grant at all: the page-load prime emits [] and seeds the dedupe ref,
      // so a subsequent account switch must not produce a redundant emit.
      mockUseStore.mockReturnValue(storeGranting([]))
      setupMocks({ account: accountA })
      const { rerender, result } = renderProvider()
      act(() => result.current.handleCommittedUrl(ORIGIN))
      act(() =>
        result.current.handleDomainMetadata(JSON.stringify({ name: 'x' }))
      )
      mockInjectJavaScript.mockClear()

      setupMocks({ account: accountB })
      act(() => rerender())

      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("'accountsChanged'")
      )
    })

    it('suppresses duplicate emits for the same resolved accounts', () => {
      mockUseStore.mockReturnValue(storeGranting([A, B]))
      setupMocks({ account: accountA })
      const { rerender, result } = renderProvider()
      act(() => result.current.handleCommittedUrl(ORIGIN))
      // First switch emits [A, B].
      setupMocks({ account: { ...mockActiveAccount } })
      act(() => rerender())
      mockInjectJavaScript.mockClear()

      // New active object, same addressC → resolves to the same [A, B];
      // must not re-emit.
      setupMocks({ account: { ...mockActiveAccount } })
      act(() => rerender())

      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("'accountsChanged'")
      )
    })

    // Build a store whose subscribe callback we can fire on demand, with a
    // mutable `grants` so we can simulate a Connected Sites revoke (a fresh
    // grants object, as Redux/Immer produces) with no active-account change.
    const subscribableStore = (
      initialGrants: Record<string, Record<string, string[]>>
    ): {
      store: ReturnType<typeof useStore>
      revoke: (next: Record<string, Record<string, string[]>>) => void
    } => {
      let grants = initialGrants
      let fire = (): void => undefined
      const store = {
        getState: () => ({ permissions: { grants } }),
        dispatch: jest.fn(),
        subscribe: jest.fn((cb: () => void) => {
          fire = cb
          return () => undefined
        })
      } as unknown as ReturnType<typeof useStore>
      return {
        store,
        revoke: next => {
          grants = next
          fire()
        }
      }
    }

    it('emits accountsChanged([]) immediately when grants are revoked from Connected Sites (no account switch)', () => {
      const { store, revoke } = subscribableStore({
        'https://opensea.io': { [A]: ['EVM'] }
      })
      mockUseStore.mockReturnValue(store)
      setupMocks({ account: accountA })
      const { result } = renderProvider()
      act(() => result.current.handleCommittedUrl(ORIGIN))
      // Prime so the dApp is seen connected to [A].
      act(() =>
        result.current.handleDomainMetadata(JSON.stringify({ name: 'OpenSea' }))
      )
      mockInjectJavaScript.mockClear()

      // Revoke from Connected Sites — active account unchanged.
      act(() => revoke({}))

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("__coreProviderEmit('accountsChanged', [])")
      )
      // ...and the emit is origin-gated so a revoke racing a cross-origin nav
      // can't deliver into a different page (same guard as the switch/prime).
      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining(
          'if(window.location.origin==="https://opensea.io")'
        )
      )
    })

    it('does not emit on store changes that leave the origin grants unchanged', () => {
      const grants = { 'https://opensea.io': { [A]: ['EVM'] } }
      // Same grants object reference on the next store change (e.g. an unrelated
      // slice updated) — must not produce a spurious accountsChanged.
      const { store, revoke } = subscribableStore(grants)
      mockUseStore.mockReturnValue(store)
      setupMocks({ account: accountA })
      const { result } = renderProvider()
      act(() => result.current.handleCommittedUrl(ORIGIN))
      act(() =>
        result.current.handleDomainMetadata(JSON.stringify({ name: 'OpenSea' }))
      )
      mockInjectJavaScript.mockClear()

      act(() => revoke(grants))

      expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining("'accountsChanged'")
      )
    })
  })
})
