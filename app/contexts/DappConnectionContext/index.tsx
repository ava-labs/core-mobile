import React, { createContext, useCallback, useContext, useEffect } from 'react'
import { PeerMeta } from 'services/walletconnect/types'
import { InteractionManager } from 'react-native'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import Logger from 'utils/Logger'
import { useDispatch, useSelector } from 'react-redux'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'
import { selectWalletState, WalletState } from 'store/app'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import {
  ApprovedAppMeta,
  rpcRequestApproved,
  rpcRequestReceived,
  selectRpcRequests,
  sendRpcError,
  setDApps
} from 'store/rpc'
import { DappRpcRequest, TypedJsonRpcRequest } from 'store/rpc/handlers/types'
import { ethErrors } from 'eth-rpc-errors'
import { SessionRequestRpcRequest } from 'store/rpc/handlers/session_request'
import WalletConnectService from 'services/walletconnect/WalletConnectService'
import { processDeeplink } from './processDeepLinking'
import { useWalletConnect } from './useWalletConnect'
import { useDeepLink } from './useDeepLink'
import { DappConnectionState } from './types'

const displayUserInstruction = (instruction: string, id?: string) => {
  showSnackBarCustom({
    component: <GeneralToast message={instruction} />,
    duration: 'short',
    id
  })
}

const handleSessionDisconnected = (peerMeta: PeerMeta) => {
  InteractionManager.runAfterInteractions(() => {
    if (peerMeta?.name) {
      displayUserInstruction(
        `${peerMeta.name} was disconnected remotely`,
        peerMeta.url
      )
    }
  })
}

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
  const activeAccount = useActiveAccount()
  const activeNetwork = useActiveNetwork()
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE
  const appNavHook = useApplicationContext().appNavHook
  const { pendingDeepLink, setPendingDeepLink, expireDeepLink } = useDeepLink()

  const handlePersistSessions = (approvedAppsMeta: ApprovedAppMeta[]) => {
    dispatch(setDApps(approvedAppsMeta))
  }

  /******************************************************************************
   * Process deep link if there is one pending and app is unlocked
   *****************************************************************************/
  useEffect(() => {
    if (pendingDeepLink && isWalletActive && activeAccount && activeNetwork) {
      processDeeplink(pendingDeepLink?.url, activeAccount, activeNetwork)
      // once we used the url, we can expire it
      expireDeepLink()
    }
  }, [
    isWalletActive,
    pendingDeepLink,
    activeAccount,
    activeNetwork,
    expireDeepLink
  ])

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
    (request: DappRpcRequest<string, unknown>, result: unknown) => {
      dispatch(
        rpcRequestApproved({
          request,
          result
        })
      )
    },
    [dispatch]
  )

  const onUserRejected = useCallback(
    (request: DappRpcRequest<string, unknown>, message?: string) => {
      dispatch(
        sendRpcError({
          request,
          error: message
            ? ethErrors.rpc.internal(message)
            : ethErrors.provider.userRejectedRequest()
        })
      )
    },
    [dispatch]
  )

  const handleSessionRequest = useCallback(
    (request: SessionRequestRpcRequest['payload']) => {
      dispatch(rpcRequestReceived(request))
    },
    [dispatch]
  )

  const handleCallRequest = useCallback(
    (request: TypedJsonRpcRequest<string, unknown>) => {
      dispatch(rpcRequestReceived(request))
    },
    [dispatch]
  )

  const killSessions = useCallback(
    async (sessionsToKill: ApprovedAppMeta[]) => {
      for (const session of sessionsToKill) {
        await WalletConnectService.killSession(session.peerId)
      }
    },
    []
  )

  useWalletConnect({
    activeAccount,
    activeNetwork,
    handleSessionRequest,
    handleCallRequest,
    handleSessionDisconnected,
    handlePersistSessions
  })

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
