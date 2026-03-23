import { renderHook, act } from '@testing-library/react-hooks'
import { useSelector, useDispatch } from 'react-redux'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { RpcMethod } from 'store/rpc/types'
import RNWebView from 'react-native-webview'
import { useEvmInjectedProvider } from './useEvmInjectedProvider'

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn()
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
    ({ chainId, address }: { chainId: string; address: string }) =>
      `SHIM(${chainId},${address})`
  )
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

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>

function setupMocks(
  overrides: {
    account?: typeof mockActiveAccount | null
    network?: typeof mockActiveNetwork
  } = {}
): void {
  const account =
    overrides.account === undefined ? mockActiveAccount : overrides.account
  const network = overrides.network ?? mockActiveNetwork

  mockUseSelector.mockImplementation(
    (selector: (state: unknown) => unknown) => {
      const selectorStr = selector.toString()
      if (
        selectorStr.includes('activeAccount') ||
        selectorStr.includes('Account')
      )
        return account
      if (
        selectorStr.includes('activeNetwork') ||
        selectorStr.includes('Network')
      )
        return network
      return undefined
    }
  )
}

describe('useEvmInjectedProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDispatch.mockReturnValue(mockDispatch)
    setupMocks()
  })

  describe('providerShimJs', () => {
    it('generates shim with active account and network', () => {
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef)
      )
      expect(result.current.providerShimJs).toBe(
        'SHIM(0xa86a,0xTestAddress1234567890)'
      )
    })

    it('uses fallback chain ID for non-EVM networks', () => {
      setupMocks({
        network: { ...mockActiveNetwork, vmName: NetworkVMType.BITCOIN }
      })
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef)
      )
      expect(result.current.providerShimJs).toBe(
        'SHIM(0x1,0xTestAddress1234567890)'
      )
    })

    it('uses empty address when no active account', () => {
      setupMocks({ account: null })
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef)
      )
      expect(result.current.providerShimJs).toBe('SHIM(0xa86a,)')
    })
  })

  describe('sendResponse', () => {
    it('injects __coreProviderRespond with result', () => {
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef)
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
        useEvmInjectedProvider(mockWebViewRef)
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
        useEvmInjectedProvider(mockWebViewRef)
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
        useEvmInjectedProvider(mockWebViewRef)
      )

      act(() => {
        result.current.handleProviderMessage('not-json')
      })

      expect(mockInjectJavaScript).not.toHaveBeenCalled()
    })

    describe('wallet_switchEthereumChain (stub)', () => {
      it('responds with null result', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
        )

        const payload = JSON.stringify({
          id: 1,
          request: {
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }]
          }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          'window.__coreProviderRespond(1, null, null); true;'
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
            useEvmInjectedProvider(mockWebViewRef)
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

          expect(mockCreateInAppRequest).toHaveBeenCalledWith(mockDispatch)
          expect(mockRequest).toHaveBeenCalledWith({
            method: rpcMethod,
            params: ['param1', 'param2'],
            chainId: 'eip155:43114'
          })
        }
      )

      it('responds with signature on approval', async () => {
        const mockRequest = jest.fn().mockResolvedValue('0xSignatureResult')
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
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

      it('responds with error code 4001 on user rejection', async () => {
        const mockRequest = jest
          .fn()
          .mockRejectedValue({ code: 4001, message: 'User rejected' })
        mockCreateInAppRequest.mockReturnValue(mockRequest)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
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
          expect.stringContaining('"code":4001')
        )
      })

      it('rejects signing when origin is unavailable', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
        )

        const payload = JSON.stringify({
          id: 22,
          request: { method: 'eth_sign', params: [] }
        })

        act(() => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32603')
        )
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
          useEvmInjectedProvider(mockWebViewRef)
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
          useEvmInjectedProvider(mockWebViewRef)
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
        global.fetch = jest.fn().mockResolvedValue(mockResponse)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
        )

        const payload = JSON.stringify({
          id: 100,
          request: { method, params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(global.fetch).toHaveBeenCalledWith(
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
        global.fetch = jest.fn().mockResolvedValue(mockResponse)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
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
        global.fetch = jest.fn().mockResolvedValue(mockResponse)

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
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
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
        )

        const payload = JSON.stringify({
          id: 103,
          request: { method: 'eth_blockNumber', params: [] }
        })

        await act(async () => {
          result.current.handleProviderMessage(payload)
        })

        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('"code":-32603')
        )
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('RPC request failed')
        )
      })

      it('handles missing RPC URL', async () => {
        setupMocks({
          network: {
            ...mockActiveNetwork,
            rpcUrl: ''
          } as typeof mockActiveNetwork
        })

        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
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
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    describe('unsupported methods', () => {
      it('returns error -32601 for unknown methods', () => {
        const { result } = renderHook(() =>
          useEvmInjectedProvider(mockWebViewRef)
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
          useEvmInjectedProvider(mockWebViewRef)
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
          useEvmInjectedProvider(mockWebViewRef)
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
          useEvmInjectedProvider(mockWebViewRef)
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
          useEvmInjectedProvider(mockWebViewRef)
        )

        expect(typeof result.current.setCurrentUrl).toBe('function')
      })
    })
  })

  describe('handleDomainMetadata', () => {
    it('stores valid domain metadata', () => {
      const { result } = renderHook(() =>
        useEvmInjectedProvider(mockWebViewRef)
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
        useEvmInjectedProvider(mockWebViewRef)
      )

      act(() => {
        result.current.handleDomainMetadata('invalid-json')
      })

      expect(result.current.dappMetadata.current).toBeNull()
    })
  })
})
