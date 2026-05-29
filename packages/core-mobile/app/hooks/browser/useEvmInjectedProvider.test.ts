import { renderHook, act } from '@testing-library/react-hooks'
import { useSelector, useDispatch, useStore } from 'react-redux'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { RpcMethod } from 'store/rpc/types'
import RNWebView from 'react-native-webview'
import { fetch as nitroFetch } from 'react-native-nitro-fetch'
import {
  selectAllNetworks,
  selectActiveNetwork,
  setActive
} from 'store/network/slice'
import { selectTabChainId, setTabChainId } from 'store/browser/slices/tabs'
import {
  EIP1193_USER_REJECTED_CODE,
  JSON_RPC_INTERNAL_ERROR_CODE,
  USER_REJECTED_REQUEST_MESSAGE
} from './injectedProvider/errors'
import { useEvmInjectedProvider } from './useEvmInjectedProvider'

// proxyToRpc calls nitroFetch; mock it explicitly (the root __mocks__ manual
// mock also covers node_modules auto-mocking, but this keeps the intent local).
jest.mock('react-native-nitro-fetch')
const mockNitroFetch = nitroFetch as jest.MockedFunction<typeof nitroFetch>

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

function setupMocks(
  overrides: {
    account?: typeof mockActiveAccount | null
    network?: typeof mockActiveNetwork
    allNetworks?: Record<number, unknown>
  } = {}
): void {
  const account =
    overrides.account === undefined ? mockActiveAccount : overrides.account
  const network = overrides.network ?? mockActiveNetwork
  const allNetworks = overrides.allNetworks ?? mockAllNetworks

  const mockTabChainIdSelector = jest.fn(() => undefined)
  ;(selectTabChainId as jest.Mock).mockReturnValue(mockTabChainIdSelector)

  mockUseSelector.mockImplementation(
    (selector: (state: unknown) => unknown) => {
      if (selector === (selectAllNetworks as unknown)) return allNetworks
      if (selector === (selectActiveNetwork as unknown)) return network
      if (selector === mockTabChainIdSelector) return undefined
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

describe('useEvmInjectedProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDispatch.mockReturnValue(mockDispatch)
    mockUseStore.mockReturnValue(mockStore)
    setupMocks()
  })

  describe('providerShimJs', () => {
    it('generates shim with active network chain', () => {
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      expect(result.current.providerShimJs).toBe('SHIM(0xa86a)')
    })

    it('uses fallback chain ID for non-EVM networks', () => {
      setupMocks({
        network: { ...mockActiveNetwork, vmName: NetworkVMType.BITCOIN }
      })
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      expect(result.current.providerShimJs).toBe('SHIM(0x1)')
    })

    it('still generates shim when no active account', () => {
      setupMocks({ account: null })
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )
      expect(result.current.providerShimJs).toBe('SHIM(0xa86a)')
    })
  })

  describe('sendResponse', () => {
    it('injects __coreProviderRespond with result', () => {
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

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
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.emitEvent('chainChanged', '0x1')
      })

      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        'window.__coreProviderEmit(\'chainChanged\', "0x1"); true;'
      )
    })

    it('injects accountsChanged with array data', () => {
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

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
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.handleProviderMessage('not-json')
      })

      expect(mockInjectJavaScript).not.toHaveBeenCalled()
    })

    describe('wallet_switchEthereumChain', () => {
      it('auto-approves, dispatches setTabChainId for the tab, and responds null', async () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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

      it('uses browser chain RPC URL for read-only methods after wallet_switchEthereumChain', async () => {
        const mockResponse = {
          ok: true,
          json: jest.fn().mockResolvedValue({ result: '0x1' })
        }
        mockNitroFetch.mockResolvedValue(mockResponse as unknown as Response)

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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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

        // Read-only call — should use chain 1's RPC, not Avalanche's
        await act(async () => {
          result.current.handleProviderMessage(
            JSON.stringify({
              id: 2,
              request: { method: 'eth_blockNumber', params: [] }
            })
          )
        })

        expect(mockNitroFetch).toHaveBeenCalledWith(
          'https://eth.rpc',
          expect.anything()
        )
      })

      it('returns null immediately when requested chain is already active', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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
          'window.__coreProviderRespond(2, null, null); true;'
        )
      })

      it('returns error 4902 when chain is not in wallet (shim no-rollback prevents wagmi re-trigger loop)', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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

      it.each(signingMethods)(
        'dispatches $dappMethod through createInAppRequest',
        async ({ dappMethod, rpcMethod }) => {
          const mockRequest = jest.fn().mockResolvedValue('0xSignature')
          mockCreateInAppRequest.mockReturnValue(mockRequest)

          const { result } = renderHook(() =>
            useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
          )

          act(() => {
            result.current.setCurrentUrl('https://example.com')
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
          expect(mockRequest).toHaveBeenCalledWith({
            method: rpcMethod,
            params: ['param1', 'param2'],
            chainId: 'eip155:43114',
            peerMeta: expect.objectContaining({
              url: 'https://example.com'
            })
          })
        }
      )

      it('derives peerMeta.name from the native URL hostname, not from page-supplied domain_metadata', async () => {
        const mockRequest = jest.fn().mockResolvedValue('0xSig')
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        // The page is actually loaded from a malicious origin...
        act(() => {
          result.current.setCurrentUrl('https://malicious.example/path')
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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        const payload = JSON.stringify({
          id: 22,
          request: { method: 'eth_sign', params: [] }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining(`"code":${JSON_RPC_INTERNAL_ERROR_CODE}`)
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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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

      it.each(readOnlyMethods)('proxies %s to RPC node', async method => {
        const mockResponse = {
          ok: true,
          json: jest.fn().mockResolvedValue({ result: '0xABC' })
        }
        mockNitroFetch.mockResolvedValue(mockResponse as unknown as Response)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        const payload = JSON.stringify({
          id: 100,
          request: { method, params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockNitroFetch).toHaveBeenCalledWith(
          'https://api.avax.network/ext/bc/C/rpc',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining(`"method":"${method}"`)
          })
        )
      })

      it('returns RPC result to WebView', async () => {
        const mockResponse = {
          ok: true,
          json: jest.fn().mockResolvedValue({ result: '0xBalanceValue' })
        }
        mockNitroFetch.mockResolvedValue(mockResponse as unknown as Response)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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
          'window.__coreProviderRespond(101, null, "0xBalanceValue"); true;'
        )
      })

      it('returns RPC error to WebView', async () => {
        const rpcError = { code: -32000, message: 'execution reverted' }
        const mockResponse = {
          ok: true,
          json: jest.fn().mockResolvedValue({ error: rpcError })
        }
        mockNitroFetch.mockResolvedValue(mockResponse as unknown as Response)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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

      it('handles fetch failure gracefully', async () => {
        mockNitroFetch.mockRejectedValue(new Error('Network error'))

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('RPC request failed')
        )
      })

      it('handles missing RPC URL', async () => {
        const emptyRpcNetwork = { ...mockActiveNetwork, rpcUrl: '' }
        setupMocks({
          network: emptyRpcNetwork as typeof mockActiveNetwork,
          allNetworks: {
            43114: emptyRpcNetwork,
            1: { ...mockActiveNetwork, chainId: 1 }
          }
        })

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        const payload = JSON.stringify({
          id: 104,
          request: { method: 'eth_getBalance', params: ['0x1'] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('No RPC URL configured')
        )
        expect(mockNitroFetch).not.toHaveBeenCalled()
      })
    })

    describe('unsupported methods', () => {
      it('returns error -32601 for unknown methods', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        const payload = JSON.stringify({
          id: 200,
          request: { method: 'eth_unknownMethod', params: [] }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32601')
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('eth_unknownMethod')
        )
      })
    })

    describe('null params handling', () => {
      it('defaults params to empty array for signing methods', async () => {
        const mockRequest = jest.fn().mockResolvedValue('0xResult')
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        act(() => {
          result.current.setCurrentUrl('https://example.com')
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
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

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

      it('rejects unknown methods with -32601', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        const payload = JSON.stringify({
          id: 401,
          request: { method: 'eth_unknownMethod', params: [] }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32601')
        )
      })

      it('exposes setCurrentUrl', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )

        expect(typeof result.current.setCurrentUrl).toBe('function')
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
  })

  describe('handleDomainMetadata', () => {
    it('stores valid domain metadata', () => {
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

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
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
      )

      act(() => {
        result.current.handleDomainMetadata('invalid-json')
      })

      expect(result.current.dappMetadata.current).toBeNull()
    })

    describe('primes _accounts on page load', () => {
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

      it('injects accountsChanged([address]) when the origin has a grant for the active account', () => {
        mockUseStore.mockReturnValue(withPermission(mockActiveAccount.addressC))
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )
        act(() => {
          result.current.setCurrentUrl('https://opensea.io/')
        })
        mockInjectJavaScript.mockClear()

        act(() => {
          result.current.handleDomainMetadata(metadata)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining(
            `__coreProviderEmit('accountsChanged', ["${mockActiveAccount.addressC}"])`
          )
        )
      })

      it('injects accountsChanged([]) when no grant exists for the origin', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )
        act(() => {
          result.current.setCurrentUrl('https://opensea.io/')
        })
        mockInjectJavaScript.mockClear()

        act(() => {
          result.current.handleDomainMetadata(metadata)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining("__coreProviderEmit('accountsChanged', [])")
        )
      })

      it('does not inject accountsChanged when origin is missing', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef, 'test-tab-id')
        )
        // currentUrlRef is never set, so origin stays ''
        mockInjectJavaScript.mockClear()

        act(() => {
          result.current.handleDomainMetadata(metadata)
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
          result.current.setCurrentUrl('https://opensea.io/')
        })
        mockInjectJavaScript.mockClear()

        act(() => {
          result.current.handleDomainMetadata(metadata)
        })

        expect(mockInjectJavaScript).not.toHaveBeenCalledWith(
          expect.stringContaining("__coreProviderEmit('accountsChanged'")
        )
      })
    })
  })
})
