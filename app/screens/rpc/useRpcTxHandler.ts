import { useEffect, useState } from 'react'
import { useGasPrice } from 'utils/GasPriceHook'
import { useAccountsContext } from '@avalabs/wallet-react-components'
import WalletConnect from 'screens/rpc/walletconnect/WalletConnect'
import { InteractionManager } from 'react-native'
import {
  MessageType,
  WalletConnectRequest
} from 'screens/rpc/walletconnect/types'
import { txToCustomEvmTx } from 'screens/rpc/util/txToCustomEvmTx'
import { ShowSnackBar } from 'components/Snackbar'
import { PeerMetadata, RPC_EVENT } from 'screens/rpc/util/types'
import { paramsToMessageParams } from 'screens/rpc/util/paramsToMessageParams'

export function useRpcTxHandler() {
  const { activeAccount } = useAccountsContext()
  const wallet = activeAccount?.wallet
  const { gasPrice } = useGasPrice()
  const [loading, setLoading] = useState(false)
  const [currentPeerMeta, setCurrentPeerMeta] = useState<any>({})
  const [currentPayload, setCurrentPayload] = useState<any>({})
  const [signMessageParams, setSignMessageParams] = useState<any>()
  const [eventType, setEventType] = useState<RPC_EVENT>()
  const [hash, setHash] = useState<string>()

  const initializeWalletConnect = () => {
    WalletConnect.emitter.on(WalletConnectRequest.SESSION, peerInfo => {
      InteractionManager.runAfterInteractions(() => {
        setCurrentPeerMeta(peerInfo)
        setEventType(RPC_EVENT.SESSION)
      })
    })
    WalletConnect.emitter.on(
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
    WalletConnect.init()
  }

  useEffect(() => {
    initializeWalletConnect()
  }, [])

  async function signMessage(messageType: MessageType, data: any) {
    console.log('messageType', messageType)
    if (!wallet || wallet.type === 'ledger') {
      throw new Error(
        wallet
          ? `this function not supported on ${wallet.type} wallet`
          : 'wallet undefined in sign tx'
      )
    }

    const isV4 =
      typeof data === 'object' && 'types' in data && 'primaryType' in data

    if (data) {
      switch (messageType) {
        case MessageType.ETH_SIGN:
        case MessageType.PERSONAL_SIGN:
          return await wallet.personalSign(data)
        case MessageType.SIGN_TYPED_DATA:
        case MessageType.SIGN_TYPED_DATA_V1: {
          if (isV4) {
            return await wallet.signTypedData_V4(data)
          }
          return await wallet.signTypedData_V1(data)
        }
        case MessageType.SIGN_TYPED_DATA_V3:
          return await wallet.signTypedData_V3(data)
        case MessageType.SIGN_TYPED_DATA_V4:
          return await wallet.signTypedData_V4(data)
      }
      throw new Error('unknown method')
    } else {
      throw new Error('no message to sign')
    }
  }

  async function onCallApproved(customParams: any) {
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
          if (WalletConnect) {
            hash = await wallet?.sendCustomEvmTx(
              evmParam.gasPrice,
              evmParam.gasLimit,
              evmParam.data,
              evmParam.to,
              evmParam.value
            )
            WalletConnect.emitter.emit(WalletConnectRequest.CALL_APPROVED, {
              id,
              hash
            })
            setHash(hash)
            ShowSnackBar('You can now go back to the browser')
          } else {
            console.log('WalletConnect exploded')
          }
        } else {
          hash = await wallet?.sendCustomEvmTx(
            gasPrice.bn,
            gas,
            data,
            params[0].to,
            params[0].value
          )
        }
        setCurrentPayload({})
      } else {
        const pData = currentPayload?.displayData.data
        hash = await signMessage(method as MessageType, pData)
        WalletConnect.emitter.emit(WalletConnectRequest.CALL_APPROVED, {
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
    WalletConnect.emitter.emit(
      WalletConnectRequest.CALL_REJECTED,
      currentPayload.peerId
    )
    clearRequests()
  }

  function onSessionApproved() {
    const { peerId } = currentPeerMeta
    WalletConnect.emitter.emit(WalletConnectRequest.SESSION_APPROVED, peerId)
    ShowSnackBar('You can now go back to the browser')
  }

  function onSessionRejected() {
    const { peerId } = currentPeerMeta
    setCurrentPeerMeta({})
    WalletConnect.emitter.emit(WalletConnectRequest.SESSION_REJECTED, peerId)
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
