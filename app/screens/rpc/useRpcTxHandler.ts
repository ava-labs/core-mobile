import { useEffect, useState } from 'react'
import { useGasPrice } from 'utils/GasPriceHook'
import { InteractionManager } from 'react-native'
import { MessageType, WalletConnectRequest } from 'services/walletconnect/types'
import { txToCustomEvmTx } from 'screens/rpc/util/txToCustomEvmTx'
import { ShowSnackBar } from 'components/Snackbar'
import { PeerMetadata, RPC_EVENT } from 'screens/rpc/util/types'
import { paramsToMessageParams } from 'screens/rpc/util/paramsToMessageParams'
import WalletConnectService from 'services/walletconnect/WalletConnectService'
import { useActiveAccount } from 'hooks/useActiveAccount'
import walletService from 'services/wallet/WalletService'
import { useActiveNetwork } from 'hooks/useActiveNetwork'

export function useRpcTxHandler() {
  const activeAccount = useActiveAccount()
  const activeNetwork = useActiveNetwork()
  const { gasPrice } = useGasPrice()
  const [loading, setLoading] = useState(false)
  const [currentPeerMeta, setCurrentPeerMeta] = useState<any>({})
  const [currentPayload, setCurrentPayload] = useState<any>({})
  const [signMessageParams, setSignMessageParams] = useState<any>()
  const [eventType, setEventType] = useState<RPC_EVENT>()
  const [hash, setHash] = useState<string>()

  const initializeWalletConnect = () => {
    WalletConnectService.emitter.on(WalletConnectRequest.SESSION, peerInfo => {
      InteractionManager.runAfterInteractions(() => {
        setCurrentPeerMeta(peerInfo)
        setEventType(RPC_EVENT.SESSION)
      })
    })
    WalletConnectService.emitter.on(
      WalletConnectRequest.CALL,
      (data: { payload: any; peerMeta: any }) => {
        const payload = data.payload
        const peerMeta = data.peerMeta as PeerMetadata
        InteractionManager.runAfterInteractions(() => {
          setCurrentPeerMeta(peerMeta)
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
              const displayData = paramsToMessageParams(currentPayload)
              setSignMessageParams({ ...currentPayload, displayData })
              setEventType(RPC_EVENT.SIGN)
            }
          }
        })
      }
    )
    WalletConnectService.init(activeAccount, activeNetwork)
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
      let hash
      const { data } = params[0]
      if (method === MessageType.ETH_SEND) {
        const gas = parseInt(params[0].gas)
        if (customParams) {
          console.log(customParams)
          const evmParam = txToCustomEvmTx(
            customParams.fees.gasPrice,
            customParams
          )
          console.log(evmParam)
          if (WalletConnectService) {
            hash = await walletService?.sign(
              {
                gasPrice: evmParam.gasPrice,
                gasLimit: evmParam.gasLimit,
                data: evmParam.data,
                to: evmParam.to,
                value: evmParam.value
              },
              activeAccount.index,
              activeNetwork
            )
            WalletConnectService.emitter.emit(
              WalletConnectRequest.CALL_APPROVED,
              {
                id,
                hash
              }
            )
            setHash(hash)
            ShowSnackBar('You can now go back to the browser')
          } else {
            console.log('WalletConnect exploded')
          }
        } else {
          hash = await walletService.sign(
            {
              gasPrice: gasPrice.bn,
              gasLimit: gas,
              data: data,
              to: params[0].to,
              value: params[0].value
            },
            activeAccount.index,
            activeNetwork
          )
        }
        setCurrentPayload({})
      } else {
        const pData = currentPayload?.displayData.data
        hash = await signMessage(method as MessageType, pData)
        WalletConnectService.emitter.emit(WalletConnectRequest.CALL_APPROVED, {
          id,
          hash
        })
        setHash(hash)
      }
    } catch (e) {
      ShowSnackBar('An error occurred. Go back to the browser')
    } finally {
      setLoading(false)
    }
  }

  function onCallRejected() {
    WalletConnectService.emitter.emit(
      WalletConnectRequest.CALL_REJECTED,
      currentPayload.peerId
    )
    clearRequests()
  }

  function onSessionApproved() {
    const { peerId } = currentPeerMeta
    WalletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_APPROVED,
      peerId
    )
    ShowSnackBar('You can now go back to the browser')
  }

  function onSessionRejected() {
    const { peerId } = currentPeerMeta
    setCurrentPeerMeta({})
    WalletConnectService.emitter.emit(
      WalletConnectRequest.SESSION_REJECTED,
      peerId
    )
    clearRequests()
  }

  function clearRequests() {
    setHash(undefined)
    setCurrentPeerMeta({})
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
