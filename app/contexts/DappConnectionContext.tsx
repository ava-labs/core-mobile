import React, { createContext, useContext, useEffect, useState } from 'react'
import walletConnectService from 'services/walletconnect/WalletConnectService'
import { MessageType, WalletConnectRequest } from 'services/walletconnect/types'
import { InteractionManager } from 'react-native'
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
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import { useSelector } from 'react-redux'
import { selectNetworkFee } from 'store/networkFee'

interface AdditionalMessageParams {
  data?: string
  from?: string
  password?: string
}

export type DappEvent = {
  payload?: JsonRpcRequest<TransactionParams[]> & AdditionalMessageParams
  peerMeta: PeerMetadata
  eventType: RPC_EVENT
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
  const [dappEvent, setDappEvent] = useState<DappEvent>()

  useEffect(() => {
    initializeWalletConnect()
  }, [])

  const initializeWalletConnect = () => {
    if (!activeAccount || !activeNetwork) return
    /**
     * SESSION
     */
    walletConnectService.emitter.on(
      WalletConnectRequest.SESSION,
      sessionInfo => {
        InteractionManager.runAfterInteractions(() => {
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

    const nonce = await (
      networkService.getProviderForNetwork(
        activeNetwork
      ) as JsonRpcBatchInternal
    ).getTransactionCount(params.from)

    return txToCustomEvmTx(networkFees.low, params).then(evmPrams => {
      return walletService
        .sign(
          {
            nonce: nonce + 1,
            chainId: activeNetwork.chainId,
            gasPrice: evmPrams.gasPrice,
            gasLimit: evmPrams.gasLimit,
            data: evmPrams.data,
            value: evmPrams.value
          },
          activeAccount.index,
          activeNetwork
        )
        .then(signedTx => {
          return networkService.sendTransaction(signedTx, activeNetwork)
        })
        .then(resultHash => {
          walletConnectService.emitter.emit(
            WalletConnectRequest.CALL_APPROVED,
            {
              id: tx.id,
              hash: resultHash
            }
          )
          return { hash: resultHash }
        })
        .catch(e => {
          Logger.error('Error approving dapp tx', e)
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
        onCallRejected
      }}>
      {children}
    </dappConnectionContext.Provider>
  )
}

export function useDappConnectionContext() {
  return useContext(dappConnectionContext)
}
