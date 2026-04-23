import { Dispatch, isAnyOf } from '@reduxjs/toolkit'
import { providerErrors } from '@metamask/rpc-errors'
import { addAppListener } from 'store/middleware/listener'
import { RpcMethod as VmModuleRpcMethod } from '@avalabs/vm-module-types'
import {
  onInAppRequestFailed,
  onInAppRequestSucceeded,
  onRequest,
  onRequestRejected
} from '../slice'
import { PeerMeta, RpcMethod } from '../types'
import { generateInAppRequestPayload } from './generateInAppRequestPayload'

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
 * Example Usage:
 *
 * const request = createInAppRequest(dispatch)
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
export const createInAppRequest = (dispatch: Dispatch): Request => {
  return ({ method, params, chainId, context, peerMeta, signal }) => {
    return new Promise((resolve, reject) => {
      const inAppRequest = generateInAppRequestPayload({
        method: method as unknown as RpcMethod,
        params,
        chainId,
        context,
        peerMeta
      })

      if (signal?.aborted) {
        reject(providerErrors.userRejectedRequest())
        return
      }

      dispatch(onRequest(inAppRequest))

      let settled = false
      // wait for the success/fail action and resolve/reject accordingly
      const unsubscribe = dispatch(
        addAppListener({
          matcher: EVENTS_TO_SUBSCRIBE,
          effect: action => {
            if (action.payload.requestId === inAppRequest.data.id) {
              if (onInAppRequestSucceeded.match(action)) {
                settled = true
                // @ts-ignore unsubscribe is a valid function
                unsubscribe()
                resolve(action.payload.txHash)
              } else if (onInAppRequestFailed.match(action)) {
                settled = true
                // @ts-ignore unsubscribe is a valid function
                unsubscribe()
                reject(action.payload.error)
              }
            }
          }
        })
      )

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            if (settled) return
            settled = true
            // @ts-ignore unsubscribe is a valid function
            unsubscribe()
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
          },
          { once: true }
        )
      }
    })
  }
}
