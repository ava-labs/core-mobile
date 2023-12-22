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
import { useAnalytics } from './useAnalytics'

export const useDappConnectionV2 = (): {
  onUserApproved: (request: Request, data?: unknown) => void
  onUserRejected: (request: Request, message?: string) => void
  killSessions: (sessionsToKill: Session[]) => Promise<void>
} => {
  const dispatch = useDispatch()
  const { capture } = useAnalytics()

  const onUserApproved = useCallback(
    (request: Request, data?: unknown) => {
      if (request.method === 'session_request') {
        capture('WalletConnectedToDapp', {
          // @ts-ignore
          dAppUrl: request.data?.verifyContext?.verified?.origin ?? ''
        })
      } else {
        capture('TxSubmittedToDapp')
      }

      dispatch(
        onRequestApproved({
          request,
          data
        })
      )
    },
    [capture, dispatch]
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
          walletConnectVersion: 'v2',
          url: sessionToKill.peer.metadata.url,
          name: sessionToKill.peer.metadata.name
        })
      })
      dispatch(killSessionsAction(sessionsToKill))
    },
    [capture, dispatch]
  )

  return { onUserApproved, onUserRejected, killSessions }
}
