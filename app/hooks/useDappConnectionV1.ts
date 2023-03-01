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

export const useDappConnectionV1 = () => {
  const dispatch = useDispatch()

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
      dispatch(killSessionsAction(sessionsToKill))
    },
    [dispatch]
  )

  return { onUserApproved, onUserRejected, killSessions }
}
