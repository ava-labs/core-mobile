/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import WalletConnectService from 'services/walletconnect/WalletConnectService'
import {
  CallRequestData,
  PeerMeta,
  RpcMethod,
  WalletConnectRequest
} from 'services/walletconnect/types'
import { InteractionManager } from 'react-native'
import { PeerMetadata, RPC_EVENT, Transaction } from 'screens/rpc/util/types'
import { paramsToMessageParams } from 'screens/rpc/util/paramsToMessageParams'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import Logger from 'utils/Logger'
import { txToCustomEvmTx } from 'screens/rpc/util/txToCustomEvmTx'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import { useDispatch, useSelector } from 'react-redux'
import { selectNetworkFee } from 'store/networkFee'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'
import { selectWalletState, WalletState } from 'store/app'
import { selectIsLoadingBalances } from 'store/balance'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import { selectAccounts } from 'store/account'
import { addContact, selectContacts } from 'store/addressBook'
import { getContactValidationError } from 'screens/drawer/addressBook/utils'
import { processDeeplink } from './processDeepLinking'
import { useWalletConnect } from './useWalletConnect'
import { useDeepLink } from './useDeepLink'
import {
  DappEvent,
  DappConnectionState,
  CoreWebAccount,
  CoreWebContact
} from './types'

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
  {} as any
)

export const DappConnectionContextProvider = ({
  children
}: {
  children: any
}) => {
  const dispatch = useDispatch()
  const accounts = useSelector(selectAccounts)
  const contacts = useSelector(selectContacts)
  const activeAccount = useActiveAccount()
  const activeNetwork = useActiveNetwork()
  const networkFees = useSelector(selectNetworkFee)
  const isLoadingBalances = useSelector(selectIsLoadingBalances)
  const [dappEvent, setDappEvent] = useState<DappEvent>()
  const walletState = useSelector(selectWalletState)
  const isWalletActive = walletState === WalletState.ACTIVE
  const appNavHook = useApplicationContext().appNavHook
  const { pendingDeepLink, setPendingDeepLink, expireDeepLink } = useDeepLink()

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

  const setEventHandled = useCallback((handled: boolean) => {
    setDappEvent(event => {
      if (event === undefined) return event

      return { ...event, handled }
    })
  }, [])

  const getAccounts: () => CoreWebAccount[] = useCallback(
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

  const getContacts: () => CoreWebContact[] = useCallback(
    () =>
      Object.values(contacts).map(contact => ({
        id: contact.id,
        name: contact.title,
        address: contact.address,
        addressBTC: contact.addressBtc
      })),
    [contacts]
  )

  const clearRequests = useCallback(() => {
    setDappEvent(undefined)
  }, [])

  const handleSessionRequest = useCallback(
    (sessionInfo: any) => {
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
    },
    [clearRequests]
  )

  const onCustomCallApproved = useCallback((id: number, result: any) => {
    WalletConnectService.emitter.emit(WalletConnectRequest.CALL_APPROVED, {
      id,
      result
    })
  }, [])

  const onCustomCallPromptApproved = useCallback(
    (result: any) => {
      WalletConnectService.emitter.emit(WalletConnectRequest.CALL_APPROVED, {
        id: dappEvent?.payload?.id,
        result
      })
      displayUserInstruction('Go back to the browser')
      clearRequests()
    },
    [clearRequests, dappEvent?.payload?.id]
  )

  const onCallRejected = useCallback((id?: number, message?: string) => {
    if (id) {
      WalletConnectService.emitter.emit(WalletConnectRequest.CALL_REJECTED, {
        id,
        message
      })
    }
  }, [])

  const onCallPromptRejected = useCallback(
    (message?: string) => {
      WalletConnectService.emitter.emit(WalletConnectRequest.CALL_REJECTED, {
        id: dappEvent?.payload?.id,
        message: message ?? 'user rejected'
      })

      clearRequests()
    },
    [clearRequests, dappEvent?.payload?.id]
  )

  const handleCallRequest = useCallback(
    (data: CallRequestData) => {
      InteractionManager.runAfterInteractions(() => {
        const payload = data.payload
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
            Logger.info('received CALL request, created message signing event')
            break
          }
          case RpcMethod.AVALANCHE_GET_ACCOUNTS: {
            const result = getAccounts()
            onCustomCallApproved(payload.id, result)
            break
          }
          case RpcMethod.AVALANCHE_GET_CONTACTS: {
            const result = getContacts()
            onCustomCallApproved(payload.id, result)
            break
          }
          case RpcMethod.AVALANCHE_UPDATE_CONTACT: {
            const { params } = payload
            const contact = params?.[0] as CoreWebContact | undefined
            const isContactValid =
              contact &&
              getContactValidationError(
                contact?.name,
                contact?.address,
                contact?.addressBTC
              ) === undefined
            console.log(isContactValid)
            if (isContactValid) {
              setDappEvent({
                payload: payload,
                peerMeta: meta,
                eventType: RPC_EVENT.UPDATE_CONTACT
              })
              Logger.info(
                `received CALL request, created ${RPC_EVENT.UPDATE_CONTACT} event`
              )
            } else {
              onCallRejected(payload.id, 'contact to update is invalid')
            }
            break
          }
        }
      })
    },
    [getAccounts, getContacts, onCallRejected, onCustomCallApproved]
  )

  useWalletConnect({
    activeAccount,
    activeNetwork,
    handleSessionRequest,
    handleCallRequest,
    handleSessionDisconnected
  })

  const onSessionApproved = useCallback(() => {
    WalletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_APPROVED,
      dappEvent?.peerMeta?.peerId
    )
    displayUserInstruction('Go back to the browser')
    clearRequests()
  }, [clearRequests, dappEvent?.peerMeta?.peerId])

  const onSessionRejected = useCallback(() => {
    WalletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_REJECTED,
      dappEvent?.peerMeta?.peerId
    )
    clearRequests()
  }, [clearRequests, dappEvent?.peerMeta?.peerId])

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
          WalletConnectService.emitter.emit(
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
    [activeAccount, activeNetwork]
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
            WalletConnectService.emitter.emit(
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
              WalletConnectService.emitter.emit(
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
    [activeAccount, activeNetwork, networkFees.low]
  )

  const onContactUpdated = useCallback(
    (contact: CoreWebContact) => {
      dispatch(
        addContact({
          address: contact.address,
          addressBtc: contact.addressBTC,
          title: contact.name,
          id: contact.id
        })
      )

      onCustomCallPromptApproved('')
    },
    [dispatch, onCustomCallPromptApproved]
  )

  return (
    <DappConnectionContext.Provider
      value={{
        dappEvent,
        onSessionApproved,
        onSessionRejected,
        onTransactionCallApproved,
        onMessageCallApproved,
        onCustomCallApproved,
        onCustomCallPromptApproved,
        onCallRejected,
        onCallPromptRejected,
        onContactUpdated,
        setEventHandled,
        pendingDeepLink,
        setPendingDeepLink
      }}>
      {children}
    </DappConnectionContext.Provider>
  )
}

export const useDappConnectionContext = () => useContext(DappConnectionContext)
