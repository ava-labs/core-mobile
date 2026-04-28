import { Dispatch, isAnyOf } from '@reduxjs/toolkit'
import { addAppListener } from 'store/middleware/listener'
import { RpcMethod as VmModuleRpcMethod } from '@avalabs/vm-module-types'
import { FeatureVars } from 'services/posthog/types'
import { RootState } from 'store/types'
import {
  onInAppRequestFailed,
  onInAppRequestSucceeded,
  onRequest
} from '../slice'
import { PeerMeta, RequestContext, RpcMethod } from '../types'
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
  peerMeta
}: {
  method: VmModuleRpcMethod
  params: unknown
  chainId?: string
  context?: Record<string, unknown>
  peerMeta?: PeerMeta
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
  return ({ method, params, chainId, context, peerMeta }) => {
    return new Promise((resolve, reject) => {
      // Snapshot the SAE override flag into context so downstream consumers
      // (gate util, ApprovalController) don't need to reach into redux from
      // outside React. Mirrors core-extension PR 900's `sae-override` flag.
      const saeOverride =
        getState().posthog.featureFlags[FeatureVars.SAE_OVERRIDE]
      const enrichedContext = {
        ...context,
        ...(saeOverride !== undefined && {
          [RequestContext.SAE_OVERRIDE]: saeOverride
        })
      }

      // create and dispatch the request
      const inAppRequest = generateInAppRequestPayload({
        method: method as unknown as RpcMethod,
        params,
        chainId,
        context: enrichedContext,
        peerMeta
      })
      dispatch(onRequest(inAppRequest))

      // wait for the success/fail action and resolve/reject accordingly
      const unsubscribe = dispatch(
        addAppListener({
          matcher: EVENTS_TO_SUBSCRIBE,
          effect: action => {
            if (action.payload.requestId === inAppRequest.data.id) {
              if (onInAppRequestSucceeded.match(action)) {
                // @ts-ignore unsubcribe is a valid function
                unsubscribe()
                resolve(action.payload.txHash)
              } else if (onInAppRequestFailed.match(action)) {
                // @ts-ignore unsubcribe is a valid function
                unsubscribe()
                reject(action.payload.error)
              }
            }
          }
        })
      )
    })
  }
}
