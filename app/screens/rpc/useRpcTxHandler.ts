import { useEffect, useState } from 'react'
import { useGasPrice } from 'utils/GasPriceHook'
import { InteractionManager } from 'react-native'
import { txToCustomEvmTx } from 'screens/rpc/util/txToCustomEvmTx'
import { ShowSnackBar } from 'components/Snackbar'
import { PeerMetadata, RPC_EVENT } from 'screens/rpc/util/types'
import { paramsToMessageParams } from 'screens/rpc/util/paramsToMessageParams'
import { useActiveAccount } from 'hooks/useActiveAccount'
import walletService from 'services/wallet/WalletService'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import walletConnectService from 'services/walletconnect/WalletConnectService'
import { MessageType, WalletConnectRequest } from 'services/walletconnect/types'
import { bnToEthersBigNumber, resolve } from '@avalabs/utils-sdk'
import { messageParent } from 'jest-worker'
import Logger from 'utils/Logger'
import networkService from 'services/network/NetworkService'

export function useRpcTxHandler() {
  const activeAccount = useActiveAccount()
  const activeNetwork = useActiveNetwork()
  const { gasPrice } = useGasPrice()
  const [loading, setLoading] = useState(false)
  const [currentPeerMeta, setCurrentPeerMeta] = useState<PeerMetadata>()
  const [currentPayload, setCurrentPayload] = useState<any>({})
  const [signMessageParams, setSignMessageParams] = useState<any>()
  const [eventType, setEventType] = useState<RPC_EVENT>()
  const [hash, setHash] = useState<string>()

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
          setCurrentPeerMeta(meta)
          setEventType(RPC_EVENT.SESSION)
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
          const payload = data.payload
          const meta: PeerMetadata = {
            peerId: payload?.peerId,
            name: data?.peerMeta?.name,
            description: data?.peerMeta?.description,
            url: data?.peerMeta?.url,
            icon: data?.peerMeta?.icons?.[0]
          }
          setCurrentPeerMeta(meta)
          setCurrentPayload(payload)
          const { method } = payload
          switch (method) {
            case MessageType.ETH_SEND:
              setEventType(RPC_EVENT.TRANSACTION)
              break
            case MessageType.ETH_SIGN:
            case MessageType.SIGN_TYPED_DATA:
            case MessageType.SIGN_TYPED_DATA_V1:
            case MessageType.SIGN_TYPED_DATA_V3:
            case MessageType.SIGN_TYPED_DATA_V4:
            case MessageType.PERSONAL_SIGN: {
              const displayData = paramsToMessageParams(payload)
              setSignMessageParams({ ...payload, displayData, site: meta })
              setEventType(RPC_EVENT.SIGN)
            }
          }
        })
      }
    )
    walletConnectService.init(activeAccount, activeNetwork)
  }

  useEffect(() => {
    initializeWalletConnect()
  }, [])

  async function signMessage(messageType: MessageType, data: any) {
    if (!activeAccount || !activeNetwork) return
    return walletService.signMessage(
      messageType,
      data,
      activeAccount.index,
      activeNetwork
    )
  }

  async function onCallApproved(customParams: any) {
    if (!activeAccount || !activeNetwork) return
    try {
      const { id, method, params } = currentPayload
      if (method === MessageType.ETH_SEND) {
        const gas = parseInt(params[0].gas)
        if (customParams) {
          console.log(customParams)
          const evmParam = txToCustomEvmTx(
            customParams.fees.gasPrice,
            customParams
          )
          console.log(evmParam)
          if (walletConnectService) {
            const [hash, error] = await resolve(
              walletService?.sign(
                {
                  gasPrice: bnToEthersBigNumber(evmParam.gasPrice),
                  gasLimit: evmParam.gasLimit,
                  data: evmParam.data,
                  to: evmParam.to,
                  value: evmParam.value
                },
                activeAccount.index,
                activeNetwork
              )
            )

            if (error) {
              Logger.error('error signing ETH send')
              return
            }

            const [sendHash, sendError] = await resolve(
              networkService.sendTransaction(hash, activeNetwork)
            )

            walletConnectService.emitter.emit(
              WalletConnectRequest.CALL_APPROVED,
              {
                id,
                hash: sendHash
              }
            )
            setHash(sendHash)
            ShowSnackBar('You can now go back to the browser')
          } else {
            console.log('WalletConnect exploded')
          }
        } else {
          const { data } = params[0]
          const [hash, error] = await walletService.sign(
            {
              gasPrice: bnToEthersBigNumber(gasPrice.bn),
              gasLimit: gas,
              data: data,
              to: params[0].to,
              value: params[0].value
            },
            activeAccount.index,
            activeNetwork
          )

          if (error) {
            Logger.error('error signing ETH send', error)
            return
          }

          const [sendHash, sendError] = await resolve(
            networkService.sendTransaction(hash, activeNetwork)
          )

          if (sendError) {
            Logger.error('error sending to network', sendError)
            return
          }

          walletConnectService.emitter.emit(
            WalletConnectRequest.CALL_APPROVED,
            {
              id,
              hash: sendHash
            }
          )
        }
        setCurrentPayload({})
      } else {
        const signData = signMessageParams?.displayData.data
        const [hash, error] = await resolve(
          walletService.signMessage(
            method,
            signData,
            activeAccount.index,
            activeNetwork
          )
        )

        if (error) {
          ShowSnackBar('An error occurred. Go back to the browser')
        } else if (hash) {
          walletConnectService.emitter.emit(
            WalletConnectRequest.CALL_APPROVED,
            {
              id,
              hash
            }
          )
          setHash(hash)
        }
      }
    } catch (e) {
      ShowSnackBar('An error occurred. Go back to the browser')
    } finally {
      setLoading(false)
    }
  }

  function onCallRejected() {
    walletConnectService.emitter.emit(
      WalletConnectRequest.CALL_REJECTED,
      currentPayload.peerId
    )
    clearRequests()
  }

  function onSessionApproved() {
    const { peerId } = currentPeerMeta
    walletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_APPROVED,
      peerId
    )
    ShowSnackBar('You can now go back to the browser')
  }

  function onSessionRejected() {
    const { peerId } = currentPeerMeta
    setCurrentPeerMeta({})
    walletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_REJECTED,
      peerId
    )
    clearRequests()
  }

  function clearRequests() {
    setHash(undefined)
    setCurrentPeerMeta(undefined)
    setCurrentPayload({})
    setEventType(undefined)
  }

  return {
    loading,
    hash,
    eventType,
    currentPeerMeta,
    currentPayload,
    signMessageParams,
    onCallApproved,
    onCallRejected,
    onSessionApproved,
    onSessionRejected
  }
}
