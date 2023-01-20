import React, { createContext, useCallback, useContext, useEffect } from 'react'
import { InteractionManager } from 'react-native'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import Logger from 'utils/Logger'
import { useDispatch, useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import {
  ApprovedAppMeta,
  onRequestApproved,
  selectRpcRequests,
  onSendRpcError,
  killSessions as killSessionsAction
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
  const rpcRequests = useSelector(selectRpcRequests)
  const activeNetwork = useActiveNetwork()
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE
  const appNavHook = useApplicationContext().appNavHook
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

  /******************************************************************************
   * Process dapp event if there is one pending and app is unlocked
   *****************************************************************************/
  useEffect(() => {
    if (
      rpcRequests?.length &&
      isWalletActive &&
      appNavHook?.navigation?.current
    ) {
      InteractionManager.runAfterInteractions(() => {
        Logger.info('opening RcpMethods up to interact with dapps')
        appNavHook?.navigation?.current?.navigate(
          AppNavigation.Modal.RpcMethodsUI
        )
      })
    }
  }, [rpcRequests, isWalletActive, appNavHook?.navigation])

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
        onSendRpcError({
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
