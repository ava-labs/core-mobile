import { ethErrors } from 'eth-rpc-errors'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  onRequestApproved,
  onRequestRejected,
  killSessions as killSessionsAction,
  ApprovedAppMeta
} from 'store/walletConnect'
import { DappRpcRequest } from 'store/walletConnect/handlers/types'
import { usePostCapture } from './usePosthogCapture'

export const useDappConnectionV1 = () => {
  const dispatch = useDispatch()
  const { capture } = usePostCapture()

  const onUserApproved = useCallback(
    (request: DappRpcRequest<string, unknown>, data?: unknown) => {
      dispatch(
        onRequestApproved({
          request,
          data
        })
      )
    },
    [dispatch]
  )

  const onUserRejected = useCallback(
    (request: DappRpcRequest<string, unknown>, message?: string) => {
      dispatch(
        onRequestRejected({
          request,
          error: message
            ? ethErrors.rpc.internal(message)
            : ethErrors.provider.userRejectedRequest()
        })
      )
    },
    [dispatch]
  )

  const killSessions = useCallback(
    async (sessionsToKill: ApprovedAppMeta[]) => {
      sessionsToKill.forEach(sessionToKill => {
        capture('ConnectedSiteRemoved', {
          dAppConnectionType: 'v1',
          peerId: sessionToKill.peerId,
          url: sessionToKill.peerMeta?.url ?? null,
          name: sessionToKill.peerMeta?.name ?? null
        })
      })
      dispatch(killSessionsAction(sessionsToKill))
    },
    [dispatch]
  )

  return { onUserApproved, onUserRejected, killSessions }
}
