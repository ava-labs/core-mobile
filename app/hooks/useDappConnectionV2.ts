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

export const useDappConnectionV2 = () => {
  const dispatch = useDispatch()

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
      dispatch(killSessionsAction(sessionsToKill))
    },
    [dispatch]
  )

  return { onUserApproved, onUserRejected, killSessions }
}
