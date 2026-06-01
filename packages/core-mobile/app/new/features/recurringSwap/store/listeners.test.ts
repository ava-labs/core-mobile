import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AppStartListening } from 'store/types'
import {
  rpcReducer,
  reducerName,
  onRequest,
  onInAppRequestSucceeded
} from 'store/rpc/slice'
import { RequestContext, RpcMethod, RpcProvider } from 'store/rpc/types'
import { addRecurringSwapListeners } from './listeners'

// ─── Mock queryClient ──────────────────────────────────────────────────────

const mockInvalidate = jest.fn()
jest.mock('contexts/ReactQueryProvider', () => ({
  queryClient: { invalidateQueries: (...args: unknown[]) => mockInvalidate(...args) }
}))

// ─── Mock AnalyticsService ─────────────────────────────────────────────────

jest.mock('services/analytics/AnalyticsService', () => ({
  capture: jest.fn()
}))
const captureSpy = AnalyticsService.capture as jest.Mock

// ─── Mock toast ────────────────────────────────────────────────────────────

const mockShowSnackbar = jest.fn()
jest.mock('new/common/utils/toast', () => ({
  showSnackbar: (...args: unknown[]) => mockShowSnackbar(...args)
}))

// ─── Helpers ───────────────────────────────────────────────────────────────

const BASE_RECURRING_CTX = {
  quoteUuid: '6674c5b1-a014-420f-9e5e-f3c4a863061f',
  fromTokenAddress: '0x' + 'a'.repeat(40),
  fromTokenSymbol: 'LINK',
  fromTokenDecimals: 18,
  toTokenAddress: '0x' + 'b'.repeat(40),
  toTokenSymbol: 'AVAX',
  toTokenDecimals: 18,
  amountPerOrder: '15000000000000000000',
  totalAmountIn: '60000000000000000000',
  numberOfOrders: 4,
  isUnlimited: false,
  frequency: { unit: 'week' as const, value: 4 },
  intervalSeconds: 2419200,
  chainId: 43114
}

const makeInAppRequest = (
  step: 'approve' | 'fill',
  overrides: Record<string, unknown> = {}
) => ({
  provider: RpcProvider.CORE_MOBILE,
  method: RpcMethod.ETH_SEND_TRANSACTION,
  peerMeta: { name: 'Core', url: '', icons: [], description: '' },
  data: {
    id: 1001,
    topic: 'core-mobile',
    params: {
      request: {
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [{ from: '0x1234', to: '0x5678', data: '0x', value: '0x0' }]
      },
      chainId: 'eip155:43114'
    }
  },
  context: {
    [RequestContext.RECURRING_SWAP]: {
      ...BASE_RECURRING_CTX,
      step,
      ...overrides
    }
  }
})

// ─── Store factory ─────────────────────────────────────────────────────────

const listenerMiddleware = createListenerMiddleware()

const setupStore = () => {
  listenerMiddleware.clearListeners()

  const store = configureStore({
    reducer: {
      [reducerName]: rpcReducer
    },
    middleware: gDM =>
      gDM({ serializableCheck: false }).prepend(listenerMiddleware.middleware)
  })

  addRecurringSwapListeners(
    listenerMiddleware.startListening as AppStartListening
  )

  return store
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('addRecurringSwapListeners', () => {
  let store: ReturnType<typeof setupStore>

  beforeEach(() => {
    mockInvalidate.mockReset()
    captureSpy.mockReset()
    mockShowSnackbar.mockReset()
    store = setupStore()
  })

  it('fires RecurringSwapScheduled and invalidates list on step=fill confirmation', async () => {
    const fillRequest = makeInAppRequest('fill')

    store.dispatch(onRequest(fillRequest as Parameters<typeof onRequest>[0]))

    // Simulate the VM module completing the tx
    store.dispatch(
      onInAppRequestSucceeded({ requestId: fillRequest.data.id, txHash: '0xdeadbeef' })
    )

    // Flush the async listener chain: the effect awaits `take`, which
    // resolves asynchronously after the second dispatch. We need several
    // microtask / macrotask cycles for RTK's listener queue to complete.
    await new Promise(r => setImmediate(r))
    await new Promise(r => setImmediate(r))

    expect(captureSpy).toHaveBeenCalledWith('RecurringSwapScheduled', {
      scheduleUuid: BASE_RECURRING_CTX.quoteUuid,
      chainId: BASE_RECURRING_CTX.chainId,
      fromTokenSymbol: BASE_RECURRING_CTX.fromTokenSymbol,
      toTokenSymbol: BASE_RECURRING_CTX.toTokenSymbol,
      amountPerOrder: BASE_RECURRING_CTX.amountPerOrder,
      numberOfOrders: BASE_RECURRING_CTX.numberOfOrders,
      isUnlimited: BASE_RECURRING_CTX.isUnlimited,
      intervalSeconds: BASE_RECURRING_CTX.intervalSeconds
    })

    expect(mockInvalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.any(Array) })
    )

    expect(mockShowSnackbar).toHaveBeenCalledWith('Recurring swap scheduled')
  })

  it('ignores step=approve (allowance approval) — no analytics, no invalidate', async () => {
    const approveRequest = makeInAppRequest('approve')

    store.dispatch(onRequest(approveRequest as Parameters<typeof onRequest>[0]))

    store.dispatch(
      onInAppRequestSucceeded({ requestId: approveRequest.data.id, txHash: '0xabc' })
    )

    await Promise.resolve()
    await Promise.resolve()

    expect(captureSpy).not.toHaveBeenCalled()
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  it('ignores plain eth_sendTransaction without recurring context', async () => {
    const plainRequest = {
      provider: RpcProvider.CORE_MOBILE,
      method: RpcMethod.ETH_SEND_TRANSACTION,
      peerMeta: { name: 'Core', url: '', icons: [], description: '' },
      data: {
        id: 2002,
        topic: 'core-mobile',
        params: {
          request: {
            method: RpcMethod.ETH_SEND_TRANSACTION,
            params: [{ from: '0x1234', to: '0x5678', data: '0x', value: '0x0' }]
          },
          chainId: 'eip155:43114'
        }
      }
      // no context at all
    }

    store.dispatch(onRequest(plainRequest as Parameters<typeof onRequest>[0]))

    store.dispatch(
      onInAppRequestSucceeded({ requestId: plainRequest.data.id, txHash: '0xfoo' })
    )

    await Promise.resolve()
    await Promise.resolve()

    expect(captureSpy).not.toHaveBeenCalled()
    expect(mockInvalidate).not.toHaveBeenCalled()
  })
})
