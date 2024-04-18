import { isAnyOf } from '@reduxjs/toolkit'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { addAppListener } from 'store/middleware/listener'
import { RpcMethod } from 'store/rpc/types'
import {
  onInAppRequestFailed,
  onInAppRequestSucceeded,
  onRequest
} from 'store/rpc/slice'
import { createInAppRequest } from 'store/rpc/utils'

const EVENTS_TO_SUBSCRIBE = isAnyOf(
  onInAppRequestSucceeded,
  onInAppRequestFailed
)

type Request = ({
  method,
  params,
  chainId
}: {
  method: RpcMethod
  params: unknown
  chainId: string
}) => Promise<string>

/**
 * A hook to execute an in-app rpc request and wait for the response.
 *
 * Example Usage:
 *
 * const { request } = useInAppRequest()
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
export const useInAppRequest = (): { request: Request } => {
  const dispatch = useDispatch()

  const request: Request = useCallback(
    ({ method, params, chainId }) => {
      return new Promise((resolve, reject) => {
        // create and dispatch the request
        const request = createInAppRequest({ method, params, chainId })
        dispatch(onRequest(request))

        // wait for the success/fail action and resolve/reject accordingly
        const unsubscribe = dispatch(
          addAppListener({
            matcher: EVENTS_TO_SUBSCRIBE,
            effect: action => {
              if (action.payload.requestId === request.data.id) {
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
    },
    [dispatch]
  )

  return { request }
}
