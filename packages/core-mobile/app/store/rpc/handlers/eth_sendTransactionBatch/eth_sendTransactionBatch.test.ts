import { CORE_MOBILE_TOPIC, RpcMethod } from '../../types'
import type { RpcRequest as InAppRpcRequest } from '../../types'

const mockOnRpcRequest = jest.fn()
const mockSelectActiveWalletId = jest.fn()
const mockSelectActiveWallet = jest.fn()
const mockSelectActiveAccount = jest.fn()
const mockGetChainIdFromCaip2 = jest.fn()

jest.mock('vmModule/ModuleManager', () => ({
  __esModule: true,
  default: {
    get evmModule() {
      return { onRpcRequest: (...args: unknown[]) => mockOnRpcRequest(...args) }
    }
  }
}))

jest.mock('store/wallet/slice', () => ({
  selectActiveWalletId: () => mockSelectActiveWalletId(),
  selectActiveWallet: () => mockSelectActiveWallet()
}))

jest.mock('store/account/slice', () => ({
  selectActiveAccount: () => mockSelectActiveAccount()
}))

jest.mock('store/network/slice', () => ({
  // Returns a (state) => Network selector when called with a numeric chainId.
  selectNetwork: () => () => ({ chainId: 43114, vmName: 'EVM' })
}))

jest.mock('utils/caip2ChainIds', () => ({
  getChainIdFromCaip2: (...args: unknown[]) => mockGetChainIdFromCaip2(...args)
}))

jest.mock('store/posthog/slice', () => ({
  selectIsQuickSwapsAvailable: () => true
}))

import { ethSendTransactionBatchHandler } from './eth_sendTransactionBatch'

const makeRequest = (
  overrides: Partial<{
    topic: string
    transactions: unknown[] | undefined
    skipIntermediateTxs?: boolean
    chainId: string
  }> = {}
): InAppRpcRequest<RpcMethod.ETH_SEND_TRANSACTION_BATCH> =>
  ({
    method: RpcMethod.ETH_SEND_TRANSACTION_BATCH,
    provider: 'CORE_MOBILE',
    peerMeta: {
      name: 'Core',
      url: '',
      icons: [],
      description: ''
    },
    context: {},
    data: {
      id: 1,
      topic: overrides.topic ?? CORE_MOBILE_TOPIC,
      params: {
        chainId: overrides.chainId ?? 'eip155:43114',
        request: {
          method: RpcMethod.ETH_SEND_TRANSACTION_BATCH,
          params: {
            transactions:
              overrides.transactions === undefined
                ? [
                    { to: '0xtoken', from: '0x123', data: '0xapprove' },
                    { to: '0xrouter', from: '0x123', data: '0xswap' }
                  ]
                : overrides.transactions,
            options: {
              skipIntermediateTxs: overrides.skipIntermediateTxs ?? true
            }
          }
        }
      }
    }
  } as never)

const listenerApi = { getState: jest.fn(() => ({})) } as never

describe('ethSendTransactionBatchHandler', () => {
  beforeEach(() => {
    mockOnRpcRequest.mockReset()
    mockGetChainIdFromCaip2.mockReset()
    mockGetChainIdFromCaip2.mockReturnValue(43114)
    mockSelectActiveWalletId.mockReturnValue('wallet-1')
    mockSelectActiveWallet.mockReturnValue({
      id: 'wallet-1',
      name: 'Main',
      type: 'mnemonic'
    })
    mockSelectActiveAccount.mockReturnValue({
      index: 0,
      addressC: '0x123'
    })
  })

  describe('trust boundary', () => {
    it('rejects external (non-in-app) requests', async () => {
      const request = makeRequest({ topic: 'wc-external-topic' })
      const result = await ethSendTransactionBatchHandler.handle(
        request,
        listenerApi
      )
      expect(result.success).toBe(false)
      expect(mockOnRpcRequest).not.toHaveBeenCalled()
    })

    it('accepts in-app requests bearing CORE_MOBILE_TOPIC', async () => {
      mockOnRpcRequest.mockResolvedValue({ result: ['0xhash1', '0xhash2'] })
      const result = await ethSendTransactionBatchHandler.handle(
        makeRequest(),
        listenerApi
      )
      expect(result.success).toBe(true)
      if (result.success) expect(result.value).toEqual(['0xhash1', '0xhash2'])
    })
  })

  describe('param validation', () => {
    it.each([
      ['missing', undefined],
      ['empty', [] as unknown[]]
    ])(
      'rejects when transactions array is %s',
      async (_label, transactions) => {
        const request = makeRequest({ transactions })
        ;(
          request.data.params.request.params as Record<string, unknown>
        ).transactions = transactions
        const result = await ethSendTransactionBatchHandler.handle(
          request,
          listenerApi
        )
        expect(result.success).toBe(false)
        expect(mockOnRpcRequest).not.toHaveBeenCalled()
      }
    )

    it('defensively rejects 1-tx batches (route through eth_sendTransaction instead)', async () => {
      const result = await ethSendTransactionBatchHandler.handle(
        makeRequest({
          transactions: [{ to: '0xrouter', from: '0x123', data: '0x' }]
        }),
        listenerApi
      )
      expect(result.success).toBe(false)
      // Handler doesn't touch the EVM module for 1-tx batches; callers
      // must route single-tx flows through `eth_sendTransaction`.
      expect(mockOnRpcRequest).not.toHaveBeenCalled()
    })

    it('rejects when chainId cannot be resolved to a known network', async () => {
      mockGetChainIdFromCaip2.mockReturnValue(undefined)
      const result = await ethSendTransactionBatchHandler.handle(
        makeRequest(),
        listenerApi
      )
      expect(result.success).toBe(false)
      expect(mockOnRpcRequest).not.toHaveBeenCalled()
    })
  })

  describe('evm-module delegation', () => {
    it('passes the SDK-shaped request to evmModule.onRpcRequest', async () => {
      mockOnRpcRequest.mockResolvedValue({ result: ['0xhash1', '0xhash2'] })
      await ethSendTransactionBatchHandler.handle(
        makeRequest({
          transactions: [
            { to: '0xa', from: '0x123', data: '0x' },
            { to: '0xb', from: '0x123', data: '0x' }
          ]
        }),
        listenerApi
      )
      const sdkRequest = mockOnRpcRequest.mock.calls[0]?.[0]
      const network = mockOnRpcRequest.mock.calls[0]?.[1]
      expect(sdkRequest?.method).toBe(RpcMethod.ETH_SEND_TRANSACTION_BATCH)
      expect(sdkRequest?.sessionId).toBe(CORE_MOBILE_TOPIC)
      expect(sdkRequest?.chainId).toBe('eip155:43114')
      expect(sdkRequest?.params?.transactions).toHaveLength(2)
      // Signing context injected for the controller to read.
      expect(sdkRequest?.context?.walletId).toBe('wallet-1')
      expect(sdkRequest?.context?.walletType).toBe('mnemonic')
      expect(sdkRequest?.context?.accountIndex).toBe(0)
      expect(sdkRequest?.context?.network).toBeDefined()
      expect(network).toEqual({ chainId: 43114, vmName: 'EVM' })
    })

    it('sends the object form {transactions, options} for multi-tx batches', async () => {
      mockOnRpcRequest.mockResolvedValue({ result: ['0xa', '0xb'] })
      await ethSendTransactionBatchHandler.handle(
        makeRequest({
          transactions: [
            { to: '0xtoken', from: '0x123', data: '0x' },
            { to: '0xrouter', from: '0x123', data: '0x' }
          ]
        }),
        listenerApi
      )
      const sdkRequest = mockOnRpcRequest.mock.calls[0]?.[0]
      expect(Array.isArray(sdkRequest?.params)).toBe(false)
      expect(sdkRequest?.params?.transactions).toHaveLength(2)
      expect(sdkRequest?.params?.options?.skipIntermediateTxs).toBe(true)
    })

    it('returns the broadcast tx hashes when evm-module succeeds', async () => {
      mockOnRpcRequest.mockResolvedValue({
        result: ['0xhash1', '0xhash2']
      })
      const result = await ethSendTransactionBatchHandler.handle(
        makeRequest({
          transactions: [
            { to: '0xtoken', from: '0x123', data: '0x' },
            { to: '0xrouter', from: '0x123', data: '0x' }
          ]
        }),
        listenerApi
      )
      expect(result).toEqual({ success: true, value: ['0xhash1', '0xhash2'] })
    })

    it('returns failure when evm-module returns error', async () => {
      mockOnRpcRequest.mockResolvedValue({
        error: { code: -32603, message: 'Manual review required' }
      })
      const result = await ethSendTransactionBatchHandler.handle(
        makeRequest({
          transactions: [
            { to: '0xa', from: '0x123', data: '0x' },
            { to: '0xb', from: '0x123', data: '0x' }
          ]
        }),
        listenerApi
      )
      expect(result.success).toBe(false)
    })
  })

  describe('redux preconditions', () => {
    it.each([
      [
        'no active wallet',
        () => mockSelectActiveWalletId.mockReturnValue(null)
      ],
      [
        'no active account',
        () => mockSelectActiveAccount.mockReturnValue(undefined)
      ]
    ])('fails fast when %s', async (_label, setup) => {
      setup()
      const result = await ethSendTransactionBatchHandler.handle(
        makeRequest(),
        listenerApi
      )
      expect(result.success).toBe(false)
      expect(mockOnRpcRequest).not.toHaveBeenCalled()
    })
  })
})
