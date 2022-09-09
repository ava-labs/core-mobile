import React, {
  createContext,
  Dispatch,
  useContext,
  useEffect,
  useState
} from 'react'
import walletConnectService from 'services/walletconnect/WalletConnectService'
import {
  DeepLink,
  DeepLinkOrigin,
  MessageType,
  WalletConnectRequest
} from 'services/walletconnect/types'
import { InteractionManager, Linking } from 'react-native'
import {
  PeerMetadata,
  RPC_EVENT,
  Transaction,
  TransactionParams
} from 'screens/rpc/util/types'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { paramsToMessageParams } from 'screens/rpc/util/paramsToMessageParams'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import Logger from 'utils/Logger'
import { txToCustomEvmTx } from 'screens/rpc/util/txToCustomEvmTx'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import { useSelector } from 'react-redux'
import { selectNetworkFee } from 'store/networkFee'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'
import { selectWalletState, WalletState } from 'store/app'
import { selectIsLoadingBalances } from 'store/balance'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import { parseUrl } from 'navigation/useDeepLinking'
import WalletConnectService from 'services/walletconnect/WalletConnectService'
import { NetworkVMType } from '@avalabs/chains-sdk'

interface AdditionalMessageParams {
  data?: string
  from?: string
  password?: string
}

export type DappEvent = {
  payload?: JsonRpcRequest<TransactionParams[]> & AdditionalMessageParams
  peerMeta: PeerMetadata
  eventType: RPC_EVENT
  handled?: boolean
}

interface DappConnectionContext {
  dappEvent?: DappEvent
  onSessionApproved: () => void
  onSessionRejected: () => void
  onTransactionCallApproved: (
    tx: Transaction
  ) => Promise<{ hash?: string; error?: any }>
  onMessageCallApproved: (
    payload: DappEvent
  ) => Promise<{ hash?: string; error?: any }>
  onCallRejected: () => void
  setEventHandled: (handled: boolean) => void
  pendingDeepLink: DeepLink | undefined
  setPendingDeepLink: Dispatch<DeepLink>
}

export const dappConnectionContext = createContext<DappConnectionContext>(
  {} as any
)

export const DappConnectionContextProvider = ({
  children
}: {
  children: any
}) => {
  const activeAccount = useActiveAccount()
  const activeNetwork = useActiveNetwork()
  const networkFees = useSelector(selectNetworkFee)
  const isLoadingBalances = useSelector(selectIsLoadingBalances)
  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLink>()
  const [dappEvent, setDappEvent] = useState<DappEvent>()
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE
  const appNavHook = useApplicationContext().appNavHook

  function expireDeepLink() {
    setPendingDeepLink(undefined)
  }

  useEffect(() => {
    initializeWalletConnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (walletState === WalletState.INACTIVE && pendingDeepLink) {
        appNavHook?.navigation?.current?.navigate(
          AppNavigation.NoWallet.Welcome,
          { screen: AppNavigation.Onboard.Login }
        )
      } else if (walletState === WalletState.NONEXISTENT && pendingDeepLink) {
        appNavHook?.navigation?.current?.navigate(
          AppNavigation.NoWallet.Welcome,
          { screen: AppNavigation.Onboard.Welcome }
        )
      }
    })
  }, [walletState, pendingDeepLink])

  /******************************************************************************
   * 1. Start listeners that will receive the deep link url
   *****************************************************************************/
  useEffect(() => {
    // triggered if app is running
    Linking.addEventListener('url', ({ url }) => {
      setPendingDeepLink({ url, origin: DeepLinkOrigin.ORIGIN_DEEPLINK })
    })
    async function checkInitialUrl() {
      // initial URL (when app comes from cold start)
      const url = await Linking.getInitialURL()
      if (url) {
        setPendingDeepLink({ url, origin: DeepLinkOrigin.ORIGIN_DEEPLINK })
      }
    }
    checkInitialUrl()
  }, [])

  /******************************************************************************
   * 2. Wait for the app to become unlocked before we handle it.
   *****************************************************************************/
  useEffect(() => {
    if (pendingDeepLink && isWalletActive && activeAccount && activeNetwork) {
      parseUrl(
        pendingDeepLink?.url,
        pendingDeepLink?.origin,
        activeAccount,
        activeNetwork
      )
      // once we used the url, we can expire it
      expireDeepLink()
    }
  }, [isWalletActive, pendingDeepLink, activeAccount, activeNetwork])

  /**
   * We need to wait for app to become ready
   */
  useEffect(() => {
    if (
      dappEvent &&
      !dappEvent.handled &&
      isWalletActive &&
      !isLoadingBalances &&
      appNavHook?.navigation?.current
    ) {
      InteractionManager.runAfterInteractions(() => {
        Logger.info('opening RcpMethods up to interact with dapps')
        appNavHook?.navigation?.current?.navigate(
          AppNavigation.Modal.RpcMethodsUI
        )
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dappEvent,
    isWalletActive,
    isLoadingBalances,
    appNavHook?.navigation?.current
  ])

  /**
   * If these changes we need to update the dapp sessions
   */
  useEffect(() => {
    if (
      activeAccount &&
      activeNetwork &&
      activeNetwork.vmName !== NetworkVMType.BITCOIN
    ) {
      WalletConnectService.updateSessions(
        activeAccount.address,
        activeNetwork.chainId.toString()
      )
    }
  }, [activeNetwork, activeAccount])

  function displayUserInstruction(instruction: string, id?: string) {
    showSnackBarCustom({
      component: <GeneralToast message={instruction} />,
      duration: 'short',
      id
    })
  }

  function setEventHandled(handled: boolean) {
    dappEvent && setDappEvent({ ...dappEvent, handled })
  }

  const initializeWalletConnect = () => {
    if (!activeAccount || !activeNetwork) return
    /**
     * SESSION
     */
    walletConnectService.emitter.on(
      WalletConnectRequest.SESSION,
      sessionInfo => {
        InteractionManager.runAfterInteractions(() => {
          clearRequests()
          const meta: PeerMetadata = {
            peerId: sessionInfo?.peerId,
            name: sessionInfo?.peerMeta?.name,
            description: sessionInfo?.peerMeta?.description,
            url: sessionInfo?.peerMeta?.url,
            icon: sessionInfo?.peerMeta?.icons?.[0]
          }
          setDappEvent({
            peerMeta: meta,
            eventType: RPC_EVENT.SESSION
          })
        })
      }
    )
    /**
     * CALL
     */
    walletConnectService.emitter.on(
      WalletConnectRequest.CALL,
      (data: { payload: any; peerMeta: any }) => {
        InteractionManager.runAfterInteractions(() => {
          clearRequests()
          const payload: JsonRpcRequest<TransactionParams[]> = data.payload
          const meta: PeerMetadata = {
            name: data?.peerMeta?.name,
            description: data?.peerMeta?.description,
            url: data?.peerMeta?.url,
            icon: data?.peerMeta?.icons?.[0]
          }
          const { method } = payload
          switch (method) {
            case MessageType.ETH_SEND:
              setDappEvent({
                payload: payload,
                peerMeta: meta,
                eventType: RPC_EVENT.TRANSACTION
              })
              Logger.info('received CALL request, created transaction event')
              break
            case MessageType.ETH_SIGN:
            case MessageType.SIGN_TYPED_DATA:
            case MessageType.SIGN_TYPED_DATA_V1:
            case MessageType.SIGN_TYPED_DATA_V3:
            case MessageType.SIGN_TYPED_DATA_V4:
            case MessageType.PERSONAL_SIGN: {
              const messageParams = paramsToMessageParams(payload)
              setDappEvent({
                payload: { ...payload, ...messageParams },
                peerMeta: meta,
                eventType: RPC_EVENT.SIGN
              })
              Logger.info(
                'received CALL request, created message signing event'
              )
            }
          }
        })
      }
    )
    /**
     * SESSION DISCONNECTED
     */
    walletConnectService.emitter.on(
      WalletConnectRequest.SESSION_DISCONNECTED,
      peerMeta => {
        InteractionManager.runAfterInteractions(() => {
          if (peerMeta?.name) {
            displayUserInstruction(
              `${peerMeta.name} was disconnected remotely`,
              peerMeta.url
            )
          }
        })
      }
    )

    walletConnectService.init(activeAccount, activeNetwork)
  }

  function clearRequests() {
    setDappEvent(undefined)
  }

  function onCallRejected() {
    walletConnectService.emitter.emit(
      WalletConnectRequest.CALL_REJECTED,
      dappEvent?.payload?.id
    )
    clearRequests()
  }

  function onSessionApproved() {
    walletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_APPROVED,
      dappEvent?.peerMeta?.peerId
    )
    displayUserInstruction('Go back to the browser')
    clearRequests()
  }

  function onSessionRejected() {
    walletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_REJECTED,
      dappEvent?.peerMeta?.peerId
    )
    clearRequests()
  }

  async function onMessageCallApproved(event: DappEvent) {
    if (!activeAccount || !activeNetwork || !event?.payload) {
      return Promise.reject({ error: 'not ready' })
    }

    const id = event.payload.id
    const method = event.payload.method as MessageType
    const dataToSign = event.payload.data

    return walletService
      .signMessage(method, dataToSign, activeAccount.index, activeNetwork)
      .then(result => {
        walletConnectService.emitter.emit(WalletConnectRequest.CALL_APPROVED, {
          id,
          hash: result
        })
        displayUserInstruction('Go back to the browser')
        return { hash: result }
      })
      .catch(e => {
        Logger.error('Error approving dapp tx', e)
        return Promise.reject({ error: e })
      })
  }

  async function onTransactionCallApproved(tx: Transaction) {
    const params = tx.txParams
    if (!activeAccount || !activeNetwork || !params) {
      return Promise.reject({ error: 'not ready' })
    }

    const nonce = await getEvmProvider(activeNetwork).getTransactionCount(
      params.from
    )

    return txToCustomEvmTx(networkFees.low, params).then(evmPrams => {
      return walletService
        .sign(
          {
            nonce,
            chainId: activeNetwork.chainId,
            gasPrice: evmPrams.gasPrice,
            gasLimit: evmPrams.gasLimit,
            data: evmPrams.data,
            to: params.to,
            value: evmPrams.value
          },
          activeAccount.index,
          activeNetwork
        )
        .then(signedTx => {
          return networkService.sendTransaction(signedTx, activeNetwork, true)
        })
        .then(resultHash => {
          walletConnectService.emitter.emit(
            WalletConnectRequest.CALL_APPROVED,
            {
              id: tx.id,
              hash: resultHash
            }
          )
          displayUserInstruction('Go back to the browser')
          return { hash: resultHash }
        })
        .catch(e => {
          const transactionHash =
            e?.transactionHash ?? e?.error?.transasctionHash
          if (transactionHash) {
            walletConnectService.emitter.emit(
              WalletConnectRequest.CALL_REJECTED,
              {
                id: tx.id,
                message: 'transaction failed'
              }
            )
          }
          return Promise.reject({ error: e })
        })
    })
  }

  return (
    <dappConnectionContext.Provider
      value={{
        dappEvent,
        onSessionApproved,
        onSessionRejected,
        onTransactionCallApproved,
        onMessageCallApproved,
        onCallRejected,
        setEventHandled,
        pendingDeepLink,
        setPendingDeepLink
      }}>
      {children}
    </dappConnectionContext.Provider>
  )
}

export function useDappConnectionContext() {
  return useContext(dappConnectionContext)
}
