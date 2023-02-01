import React, { createContext, useCallback, useContext, useEffect } from 'react'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useDispatch, useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import {
  ApprovedAppMeta,
  onRequestApproved,
  killSessions as killSessionsAction,
  onRequestRejected
} from 'store/walletConnect'
import { DappRpcRequest } from 'store/walletConnect/handlers/types'
import { ethErrors } from 'eth-rpc-errors'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { processDeeplink } from './processDeepLinking'
import { useDeepLink } from './useDeepLink'
import { DappConnectionState } from './types'

export const DappConnectionContext = createContext<DappConnectionState>(
  {} as DappConnectionState
)

export const DappConnectionContextProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const dispatch = useDispatch()
  const activeNetwork = useActiveNetwork()
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE
  const { pendingDeepLink, setPendingDeepLink, expireDeepLink } = useDeepLink()

  /******************************************************************************
   * Process deep link if there is one pending and app is unlocked
   *****************************************************************************/
  useEffect(() => {
    // do not process if on BTC
    if (activeNetwork?.vmName === NetworkVMType.BITCOIN) return

    if (pendingDeepLink && isWalletActive) {
      processDeeplink(pendingDeepLink?.url, dispatch)
      // once we used the url, we can expire it
      expireDeepLink()
    }
  }, [isWalletActive, pendingDeepLink, activeNetwork, expireDeepLink, dispatch])

  const onUserApproved = useCallback(
    (request: DappRpcRequest<string, unknown>, data: unknown) => {
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

  const killSessions = async (sessionsToKill: ApprovedAppMeta[]) => {
    dispatch(killSessionsAction(sessionsToKill))
  }

  return (
    <DappConnectionContext.Provider
      value={{
        onUserApproved,
        onUserRejected,
        pendingDeepLink,
        setPendingDeepLink,
        killSessions
      }}>
      {children}
    </DappConnectionContext.Provider>
  )
}

export const useDappConnectionContext = () => useContext(DappConnectionContext)
