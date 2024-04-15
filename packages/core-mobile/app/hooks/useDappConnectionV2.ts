import { ethErrors } from 'eth-rpc-errors'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Session } from 'services/walletconnectv2/types'
import {
  onRequestApproved,
  onRequestRejected,
  Request,
  RpcMethod
} from 'store/rpc'
import { killSessions as killSessionsAction } from 'store/walletConnectV2/slice'

export const useDappConnectionV2 = (): {
  onUserApproved: (request: Request, data?: unknown) => void
  onUserRejected: (request: Request, message?: string) => void
  killSessions: (sessionsToKill: Session[]) => Promise<void>
} => {
  const dispatch = useDispatch()

  const onUserApproved = useCallback(
    (request: Request, data?: unknown) => {
      if (request.method === RpcMethod.WC_SESSION_REQUEST) {
        AnalyticsService.capture('WalletConnectedToDapp', {
          // @ts-ignore
          dAppUrl: request.data?.verifyContext?.verified?.origin ?? ''
        })
      } else {
        AnalyticsService.capture('TxSubmittedToDapp')
      }

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
        AnalyticsService.capture('ConnectedSiteRemoved', {
          walletConnectVersion: 'v2',
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
