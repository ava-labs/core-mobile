import { RpcMethod as VmModuleRpcMethod } from '@avalabs/vm-module-types'
import {
  onInAppRequestFailed,
  onInAppRequestSucceeded,
  onRequest,
  onRequestRejected
} from '../slice'
import { createInAppRequest } from './createInAppRequest'
import * as generatePayload from './generateInAppRequestPayload'

const FIXED_REQUEST_ID = 9999

let mockListenerEffects: Array<(action: unknown) => void> = []

jest.mock('store/middleware/listener', () => ({
  addAppListener: (opts: { effect: (action: unknown) => void }) => {
    return () => {
      // Registering returns an action. When the reducer sees it, it'd hook
      // the listener. Our mock directly tracks the effect so tests can
      // drive it.
      mockListenerEffects.push(opts.effect)
      return () => {
        mockListenerEffects = mockListenerEffects.filter(fn => fn !== opts.effect)
      }
    }
  }
}))

// Some imports inside createInAppRequest use `store/rpc/types` to bring in
// the full RpcMethod enum (required for the payload). We don't need a full
// mock there — the real enum works fine in tests.

describe('createInAppRequest', () => {
  let dispatch: jest.Mock
  let payloadSpy: jest.SpyInstance

  beforeEach(() => {
    mockListenerEffects = []
    dispatch = jest.fn(action => {
      // Redux dispatch returns whatever the middleware chain returns. For
      // the listener middleware, the dispatched action is a thunk-like thing
      // that registers the listener and returns an unsubscribe. For plain
      // actions, return the action.
      if (typeof action === 'function') return action()
      return action
    })

    // Deterministic request id so we can reference it in onRequestRejected
    // assertions below.
    payloadSpy = jest
      .spyOn(generatePayload, 'generateInAppRequestPayload')
      .mockImplementation(({ method, params, chainId, peerMeta }) => ({
        provider: 'core-mobile' as unknown as never,
        method,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          id: FIXED_REQUEST_ID,
          topic: 'core-mobile-test',
          params: { request: { method, params }, chainId: chainId ?? '' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        peerMeta
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any))
  })

  afterEach(() => {
    payloadSpy.mockRestore()
  })

  it('rejects synchronously without dispatching onRequest when signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    const request = createInAppRequest(dispatch)

    await expect(
      request({
        method: VmModuleRpcMethod.PERSONAL_SIGN,
        params: [],
        signal: controller.signal
      })
    ).rejects.toEqual(
      expect.objectContaining({ code: 4001 })
    )

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: onRequest.type })
    )
  })

  it('dispatches onRequestRejected when the signal aborts mid-flight', async () => {
    const controller = new AbortController()
    const request = createInAppRequest(dispatch)

    const promise = request({
      method: VmModuleRpcMethod.PERSONAL_SIGN,
      params: ['0xMsg', '0xAddr'],
      signal: controller.signal
    })

    // onRequest should have been dispatched once
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: onRequest.type })
    )

    controller.abort()

    await expect(promise).rejects.toEqual(
      expect.objectContaining({ code: 4001 })
    )

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: onRequestRejected.type,
        payload: expect.objectContaining({
          request: expect.objectContaining({
            data: expect.objectContaining({ id: FIXED_REQUEST_ID })
          })
        })
      })
    )
  })

  it('ignores a later success event after abort has settled the promise', async () => {
    const controller = new AbortController()
    const request = createInAppRequest(dispatch)

    const promise = request({
      method: VmModuleRpcMethod.PERSONAL_SIGN,
      params: [],
      signal: controller.signal
    })

    controller.abort()

    // Fire a spurious success after abort — promise should already have
    // settled to reject and must not flip to resolve.
    mockListenerEffects.forEach(effect =>
      effect(
        onInAppRequestSucceeded({
          requestId: FIXED_REQUEST_ID,
          txHash: '0xDEADBEEF'
        })
      )
    )

    await expect(promise).rejects.toEqual(
      expect.objectContaining({ code: 4001 })
    )
  })

  it('does NOT dispatch onRequestRejected when the listener settles first (normal success)', async () => {
    const controller = new AbortController()
    const request = createInAppRequest(dispatch)

    const promise = request({
      method: VmModuleRpcMethod.PERSONAL_SIGN,
      params: [],
      signal: controller.signal
    })

    // Simulate the handler dispatching onInAppRequestSucceeded.
    mockListenerEffects.forEach(effect =>
      effect(
        onInAppRequestSucceeded({
          requestId: FIXED_REQUEST_ID,
          txHash: '0xABC'
        })
      )
    )

    await expect(promise).resolves.toBe('0xABC')

    // A subsequent abort should be a no-op: no onRequestRejected dispatched.
    dispatch.mockClear()
    controller.abort()

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: onRequestRejected.type })
    )
  })

  it('rejects when the listener settles with onInAppRequestFailed (no abort involved)', async () => {
    const request = createInAppRequest(dispatch)

    const promise = request({
      method: VmModuleRpcMethod.PERSONAL_SIGN,
      params: []
    })

    const err = { code: 4001, message: 'user rejected' }
    mockListenerEffects.forEach(effect =>
      effect(
        onInAppRequestFailed({
          requestId: FIXED_REQUEST_ID,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          error: err as any
        })
      )
    )

    await expect(promise).rejects.toEqual(err)
  })
})
