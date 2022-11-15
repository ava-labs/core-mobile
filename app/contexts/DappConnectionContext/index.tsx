/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import walletConnectService from 'services/walletconnect/WalletConnectService'
import WalletConnectService from 'services/walletconnect/WalletConnectService'
import {
  DeepLink,
  DeepLinkOrigin,
  RpcMethod,
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
import { NetworkVMType } from '@avalabs/chains-sdk'
import { selectAccounts } from 'store/account'
import { selectContacts } from 'store/addressBook'
import { processDeeplink } from './processDeepLinking'

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
  const accounts = useSelector(selectAccounts)
  const contacts = useSelector(selectContacts)
  const activeAccount = useActiveAccount()
  const activeNetwork = useActiveNetwork()
  const networkFees = useSelector(selectNetworkFee)
  const isLoadingBalances = useSelector(selectIsLoadingBalances)
  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLink>()
  const [dappEvent, setDappEvent] = useState<DappEvent>()
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE
  const appNavHook = useApplicationContext().appNavHook

  const expireDeepLink = useCallback(() => {
    setPendingDeepLink(undefined)
  }, [])

  useEffect(() => {
    initializeWalletConnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /******************************************************************************
   * Start listeners that will receive the deep link url
   *****************************************************************************/
  useEffect(() => {
    // triggered if app is running
    const listener = Linking.addEventListener('url', ({ url }) => {
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

    return () => {
      listener.remove()
    }
  }, [])

  /******************************************************************************
   * Process deep link if there is one pending and app is unlocked
   *****************************************************************************/
  useEffect(() => {
    if (pendingDeepLink && isWalletActive && activeAccount && activeNetwork) {
      processDeeplink(
        pendingDeepLink?.url,
        pendingDeepLink?.origin,
        activeAccount,
        activeNetwork
      )
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

  /******************************************************************************
   * Update dapp sessions if active address or chain id changes
   *****************************************************************************/
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

  const displayUserInstruction = useCallback(
    (instruction: string, id?: string) => {
      showSnackBarCustom({
        component: <GeneralToast message={instruction} />,
        duration: 'short',
        id
      })
    },
    []
  )

  const setEventHandled = useCallback((handled: boolean) => {
    setDappEvent(event => {
      if (event === undefined) return event

      return { ...event, handled }
    })
  }, [])

  const getAccounts = useCallback(
    () =>
      Object.values(accounts).map(account => ({
        index: account.index,
        name: account.title,
        addressC: account.address,
        addressBTC: account.addressBtc,
        active: account.index === activeAccount?.index
      })),
    [accounts, activeAccount?.index]
  )

  const getContacts = useCallback(
    () =>
      Object.values(contacts).map(contact => ({
        id: contact.id,
        name: contact.title,
        address: contact.address,
        addressBTC: contact.addressBtc
      })),
    [contacts]
  )

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
          const payload: JsonRpcRequest<TransactionParams[]> = data.payload
          const meta: PeerMetadata = {
            name: data?.peerMeta?.name,
            description: data?.peerMeta?.description,
            url: data?.peerMeta?.url,
            icon: data?.peerMeta?.icons?.[0]
          }
          const { method } = payload
          switch (method) {
            case RpcMethod.ETH_SEND:
              setDappEvent({
                payload: payload,
                peerMeta: meta,
                eventType: RPC_EVENT.TRANSACTION
              })
              Logger.info('received CALL request, created transaction event')
              break
            case RpcMethod.ETH_SIGN:
            case RpcMethod.SIGN_TYPED_DATA:
            case RpcMethod.SIGN_TYPED_DATA_V1:
            case RpcMethod.SIGN_TYPED_DATA_V3:
            case RpcMethod.SIGN_TYPED_DATA_V4:
            case RpcMethod.PERSONAL_SIGN: {
              const messageParams = paramsToMessageParams(payload)
              setDappEvent({
                payload: { ...payload, ...messageParams },
                peerMeta: meta,
                eventType: RPC_EVENT.SIGN
              })
              Logger.info(
                'received CALL request, created message signing event'
              )
              break
            }
            case RpcMethod.AVALANCHE_GET_ACCOUNTS: {
              const result = getAccounts()
              approveCustomCall(payload.id, result)
              break
            }
            case RpcMethod.AVALANCHE_GET_CONTACTS: {
              const result = getContacts()
              console.log('result', result)
              approveCustomCall(payload.id, result)
              break
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

  const clearRequests = useCallback(() => {
    setDappEvent(undefined)
  }, [])

  const onCallRejected = useCallback(() => {
    walletConnectService.emitter.emit(
      WalletConnectRequest.CALL_REJECTED,
      dappEvent?.payload?.id
    )
    clearRequests()
  }, [clearRequests, dappEvent?.payload?.id])

  const onSessionApproved = useCallback(() => {
    walletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_APPROVED,
      dappEvent?.peerMeta?.peerId
    )
    displayUserInstruction('Go back to the browser')
    clearRequests()
  }, [clearRequests, dappEvent?.peerMeta?.peerId, displayUserInstruction])

  const onSessionRejected = useCallback(() => {
    walletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_REJECTED,
      dappEvent?.peerMeta?.peerId
    )
    clearRequests()
  }, [clearRequests, dappEvent?.peerMeta?.peerId])

  const approveCustomCall = useCallback(
    (id: number, result: any) => {
      if (!activeAccount || !activeNetwork || !id) {
        return Promise.reject({ error: 'not ready' })
      }

      walletConnectService.emitter.emit(WalletConnectRequest.CALL_APPROVED, {
        id,
        result
      })
    },
    [activeAccount, activeNetwork]
  )

  const onMessageCallApproved = useCallback(
    async (event: DappEvent) => {
      if (!activeAccount || !activeNetwork || !event?.payload) {
        return Promise.reject({ error: 'not ready' })
      }

      const id = event.payload.id
      const method = event.payload.method as RpcMethod
      const dataToSign = event.payload.data

      return walletService
        .signMessage(method, dataToSign, activeAccount.index, activeNetwork)
        .then(result => {
          walletConnectService.emitter.emit(
            WalletConnectRequest.CALL_APPROVED,
            {
              id,
              result
            }
          )
          displayUserInstruction('Go back to the browser')
          return { hash: result }
        })
        .catch(e => {
          Logger.error('Error approving dapp tx', e)
          return Promise.reject({ error: e })
        })
    },
    [activeAccount, activeNetwork, displayUserInstruction]
  )

  const onTransactionCallApproved = useCallback(
    async (tx: Transaction) => {
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
                result: resultHash
              }
            )
            displayUserInstruction('Go back to the browser')
            return { hash: resultHash }
          })
          .catch(e => {
            Logger.error(
              'failed to approve transaction call',
              JSON.stringify(e)
            )
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
    },
    [activeAccount, activeNetwork, displayUserInstruction, networkFees.low]
  )

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

export const useDappConnectionContext = () => useContext(dappConnectionContext)
