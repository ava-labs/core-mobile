import { Dispatch, isAnyOf } from '@reduxjs/toolkit'
import { providerErrors } from '@metamask/rpc-errors'
import { addAppListener } from 'store/middleware/listener'
import { RpcMethod as VmModuleRpcMethod } from '@avalabs/vm-module-types'
import { selectSaeOverride } from 'store/posthog/slice'
import { RootState } from 'store/types'
import {
  onInAppRequestFailed,
  onInAppRequestSucceeded,
  onRequest,
  onRequestRejected
} from '../slice'
import { PeerMeta, RequestContext, RpcMethod } from '../types'
import { generateInAppRequestPayload } from './generateInAppRequestPayload'
import { clearRequestSignal, setRequestSignal } from './inFlightRequestSignals'

const EVENTS_TO_SUBSCRIBE = isAnyOf(
  onInAppRequestSucceeded,
  onInAppRequestFailed
)

export type Request = ({
  method,
  params,
  chainId,
  context,
  peerMeta,
  signal
}: {
  method: VmModuleRpcMethod
  params: unknown
  chainId?: string
  context?: Record<string, unknown>
  peerMeta?: PeerMeta
  /**
   * Optional AbortSignal. Aborting cancels the in-flight request by
   * dispatching `onRequestRejected` (so any open handler — including
   * `eth_sendTransaction` sitting on an approval screen — sees the rejection
   * before it broadcasts) and rejects the returned Promise with
   * `userRejectedRequest`.
   */
  signal?: AbortSignal
}) => Promise<string>

/**
 * A function to create the request function to execute in-app rpc request and wait for the response.
 *
 * `getState` is used to snapshot redux-derived values (currently the
 * `sae-override` feature flag) into the request's context at creation time,
 * so non-React/non-redux consumers like ApprovalController and the gate util
 * can read them off the request without needing their own redux access.
 *
 * Example Usage:
 *
 * const request = createInAppRequest(dispatch, getState)
 *
 * const txParams = [
 *  {
 *    "from": "0x341b0073b66bfc19FCB54308861f604F5Eb8f51b",
 *    "to": "0x341b0073b66bfc19FCB54308861f604F5Eb8f51b",
 *    "value": "0x5af3107a4000",
 *    "data": "0x"
 *  }
 * ]
 *
 * const txHash = await request({
 *    method: RpcMethod.ETH_SEND_TRANSACTION,
 *    params: txParams,
 *    chainId: '43114'
 * })
 */
export const createInAppRequest = (
  dispatch: Dispatch,
  getState: () => RootState
): Request => {
  return ({ method, params, chainId, context, peerMeta, signal }) => {
    return new Promise((resolve, reject) => {
      // Snapshot the SAE override flag into context so downstream consumers
      // (gate util, ApprovalController) don't need to reach into redux from
      // outside React. Mirrors core-extension PR 900's `sae-override` flag.
      const saeOverride = selectSaeOverride(getState())
      const enrichedContext = {
        ...context,
        [RequestContext.SAE_OVERRIDE]: saeOverride
      }

      // create and dispatch the request
      const inAppRequest = generateInAppRequestPayload({
        method: method as unknown as RpcMethod,
        params,
        chainId,
        context: enrichedContext,
        peerMeta
      })

      if (signal?.aborted) {
        reject(providerErrors.userRejectedRequest())
        return
      }

      const requestKey = String(inAppRequest.data.id)

      dispatch(onRequest(inAppRequest))

      let settled = false
      // Abort listener, detached on settle so it doesn't keep this closure
      // attached to a long-lived `signal` (pattern: LedgerService.ts). A no-op
      // default lets the success/fail paths call removeEventListener
      // unconditionally — it's replaced below when a `signal` is provided.
      let onAbort: () => void = () => undefined

      // wait for the success/fail action and resolve/reject accordingly
      const unsubscribe = dispatch(
        addAppListener({
          matcher: EVENTS_TO_SUBSCRIBE,
          effect: action => {
            if (action.payload.requestId !== inAppRequest.data.id) return
            if (onInAppRequestSucceeded.match(action)) {
              settled = true
              // @ts-ignore unsubscribe is a valid function
              unsubscribe()
              signal?.removeEventListener('abort', onAbort)
              clearRequestSignal(requestKey)
              resolve(action.payload.txHash)
            } else if (onInAppRequestFailed.match(action)) {
              settled = true
              // @ts-ignore unsubscribe is a valid function
              unsubscribe()
              signal?.removeEventListener('abort', onAbort)
              clearRequestSignal(requestKey)
              reject(action.payload.error)
            }
          }
        })
      )

      if (signal) {
        // Expose the signal so ApprovalController can settle a parked approval
        // (and tear down Ledger BLE) if this request is cancelled by a
        // cross-origin nav. Set here (same sync tick, before the listener effect
        // runs) and cleared on every settle path. (CP-14422)
        setRequestSignal(requestKey, signal)
        onAbort = () => {
          if (settled) return
          settled = true
          // @ts-ignore unsubscribe is a valid function
          unsubscribe()
          // Keep the aborted signal in the map so a requestApproval that hasn't
          // parked yet (abort landed in the pre-park window) still sees it and
          // cancels itself instead of opening a stale modal. Do NOT clear it on
          // a timer here: a slow `requestApproval` (observed on iOS, where the
          // approval parks AFTER the cross-origin nav) would otherwise find the
          // signal already gone, park an uncancellable sheet, and leave it
          // lingering. The approval bridge clears it when it claims the signal;
          // the never-claimed case ages out via the bounded signal map. (CP-14422)
          // Propagate a rejection so any handler currently sitting on the
          // approval screen (e.g. eth_sendTransaction) short-circuits
          // before broadcasting. The handler's machinery will dispatch
          // onInAppRequestFailed, but the listener above is already
          // `settled` so our reject() only fires once.
          //
          // Known race (Phase 3 Stage B): if the user has already tapped
          // Approve and `handleRequestInternally` has matched the approval
          // action, the handler's `approve(...)` path (which signs and
          // broadcasts) is already running and this dispatch is dropped.
          // Fully closing the window requires plumbing AbortSignal into
          // WalletService.sign and the VM-module broadcast path — out of
          // scope for this phase. The window we DO close: user opens an
          // approval modal but has NOT yet tapped Approve when navigation
          // happens.
          dispatch(
            onRequestRejected({
              request: inAppRequest,
              error: providerErrors.userRejectedRequest() as Parameters<
                typeof onRequestRejected
              >[0]['error']
            })
          )
          reject(providerErrors.userRejectedRequest())
        }
        signal.addEventListener('abort', onAbort, { once: true })
      }
    })
  }
}
