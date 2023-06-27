import { ethErrors } from 'eth-rpc-errors'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Session } from 'services/walletconnectv2/types'
import {
  onRequestApproved,
  onRequestRejected,
  killSessions as killSessionsAction,
  Request
} from 'store/walletConnectV2'
import { usePostCapture } from './usePosthogCapture'

export const useDappConnectionV2 = () => {
  const dispatch = useDispatch()
  const { capture } = usePostCapture()

  const onUserApproved = useCallback(
    (request: Request, data?: unknown) => {
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
    (request: Request, message?: string) => {
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
    async (sessionsToKill: Session[]) => {
      sessionsToKill.forEach(sessionToKill => {
        capture('ConnectedSiteRemoved', {
          dAppConnectionType: 'v2',
          url: sessionToKill.peer.metadata.url,
          name: sessionToKill.peer.metadata.name
        })
      })
      dispatch(killSessionsAction(sessionsToKill))
    },
    [dispatch]
  )

  return { onUserApproved, onUserRejected, killSessions }
}
