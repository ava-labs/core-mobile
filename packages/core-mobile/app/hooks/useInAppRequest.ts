import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { createInAppRequest, Request } from 'store/rpc/utils/createInAppRequest'

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
 *    chainId: 'eip155:43114'
 * })
 */
export const useInAppRequest = (): { request: Request } => {
  const dispatch = useDispatch()

  const request = useMemo(() => createInAppRequest(dispatch), [dispatch])

  return { request }
}
