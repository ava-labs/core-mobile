import { RpcMethod as VmModuleRpcMethod } from '@avalabs/vm-module-types'
import { FeatureVars } from 'services/posthog/types'
import { RootState } from 'store/types'
import {
  onInAppRequestFailed,
  onInAppRequestSucceeded,
  onRequest,
  onRequestRejected
} from '../slice'
import { RequestContext } from '../types'
import { createInAppRequest } from './createInAppRequest'
import * as generatePayload from './generateInAppRequestPayload'

const FIXED_REQUEST_ID = 9999

let mockListenerEffects: Array<(action: unknown) => void> = []

jest.mock('store/middleware/listener', () => ({
  addAppListener: (opts: { effect: (action: unknown) => void }) => {
    return () => {
      // Our mock tracks the effect directly so tests can drive it.
      mockListenerEffects.push(opts.effect)
      return () => {
        mockListenerEffects = mockListenerEffects.filter(
          fn => fn !== opts.effect
        )
      }
    }
  }
}))

const makeState = (saeOverride?: string): RootState =>
  ({
    posthog: {
      featureFlags: saeOverride
        ? { [FeatureVars.SAE_OVERRIDE]: saeOverride }
        : {}
    }
  } as unknown as RootState)

const defaultGetState = (): RootState => makeState(undefined)

describe('createInAppRequest', () => {
  let dispatch: jest.Mock
  let payloadSpy: jest.SpyInstance

  beforeEach(() => {
    mockListenerEffects = []
    dispatch = jest.fn(action => {
      // The listener middleware action is a thunk that registers the listener
      // and returns an unsubscribe; plain actions are returned as-is.
      if (typeof action === 'function') return action()
      return action
    })

    // Deterministic request id so we can reference it in onRequestRejected
    // assertions below.
    payloadSpy = jest
      .spyOn(generatePayload, 'generateInAppRequestPayload')
      .mockImplementation(
        ({ method, params, chainId, peerMeta }) =>
          ({
            provider: 'core-mobile' as unknown as never,
            method,

            data: {
              id: FIXED_REQUEST_ID,
              topic: 'core-mobile-test',
              params: { request: { method, params }, chainId: chainId ?? '' }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            peerMeta
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)
      )
  })

  afterEach(() => {
    payloadSpy.mockRestore()
  })

  describe('sae-override context', () => {
    it('snapshots the sae-override flag into request.context when set', () => {
      const request = createInAppRequest(dispatch, () => makeState('enabled'))

      request({
        method: VmModuleRpcMethod.ETH_SEND_TRANSACTION,
        params: [],
        chainId: 'eip155:43114',
        context: { existing: 'value' }
      })

      expect(payloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context: {
            existing: 'value',
            [RequestContext.SAE_OVERRIDE]: 'enabled'
          }
        })
      )
    })

    it("defaults the sae-override key to 'auto' when the flag is unset", () => {
      const request = createInAppRequest(dispatch, () => makeState(undefined))

      request({
        method: VmModuleRpcMethod.ETH_SEND_TRANSACTION,
        params: [],
        chainId: 'eip155:43114'
      })

      expect(payloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { [RequestContext.SAE_OVERRIDE]: 'auto' }
        })
      )
    })

    it('reads the flag at request creation time, not at module load time', () => {
      let currentOverride: string | undefined = 'disabled'
      const request = createInAppRequest(dispatch, () =>
        makeState(currentOverride)
      )

      currentOverride = 'enabled'

      request({
        method: VmModuleRpcMethod.ETH_SEND_TRANSACTION,
        params: [],
        chainId: 'eip155:43114'
      })

      expect(payloadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { [RequestContext.SAE_OVERRIDE]: 'enabled' }
        })
      )
    })
  })

  describe('abort / cancellation', () => {
    it('rejects synchronously without dispatching onRequest when signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort()

      const request = createInAppRequest(dispatch, defaultGetState)

      await expect(
        request({
          method: VmModuleRpcMethod.PERSONAL_SIGN,
          params: [],
          signal: controller.signal
        })
      ).rejects.toEqual(expect.objectContaining({ code: 4001 }))

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: onRequest.type })
      )
    })

    it('dispatches onRequestRejected when the signal aborts mid-flight', async () => {
      const controller = new AbortController()
      const request = createInAppRequest(dispatch, defaultGetState)

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
      const request = createInAppRequest(dispatch, defaultGetState)

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
      const request = createInAppRequest(dispatch, defaultGetState)

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

    it('detaches the abort listener when the request settles, so it is not retained', async () => {
      const controller = new AbortController()
      const removeSpy = jest.spyOn(controller.signal, 'removeEventListener')
      const request = createInAppRequest(dispatch, defaultGetState)

      const promise = request({
        method: VmModuleRpcMethod.PERSONAL_SIGN,
        params: [],
        signal: controller.signal
      })

      mockListenerEffects.forEach(effect =>
        effect(
          onInAppRequestSucceeded({
            requestId: FIXED_REQUEST_ID,
            txHash: '0xABC'
          })
        )
      )
      await expect(promise).resolves.toBe('0xABC')

      expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function))
    })

    it('rejects when the listener settles with onInAppRequestFailed (no abort involved)', async () => {
      const request = createInAppRequest(dispatch, defaultGetState)

      const promise = request({
        method: VmModuleRpcMethod.PERSONAL_SIGN,
        params: []
      })

      const err = { code: 4001, message: 'user rejected' }
      mockListenerEffects.forEach(effect =>
        effect(
          onInAppRequestFailed({ requestId: FIXED_REQUEST_ID, error: err })
        )
      )

      await expect(promise).rejects.toEqual(err)
    })
  })
})
