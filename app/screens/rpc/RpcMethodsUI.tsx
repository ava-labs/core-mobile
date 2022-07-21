import React, { FC, useEffect, useState } from 'react'
import { InteractionManager, Modal, StyleSheet } from 'react-native'
import WalletConnect from 'WalletConnect'
import AccountApproval from 'screens/rpc/AccountApproval'
import TransactionSummary from 'screens/rpc/TransactionSummary'
import { Action, MessageType } from 'navigation/messages/models'
import { useWalletContext } from '@avalabs/wallet-react-components'
import { useGasPrice } from 'utils/GasPriceHook'
import { paramsToMessageParams } from 'rpc/paramsToMessageParams'
import SignMessage from 'screens/rpc/SignMessage/SignMessage'

const RpcMethodsUI: FC = () => {
  const [showPendingApproval, setShowPendingApproval] = useState(false)
  const [walletConnectRequest, setWalletConnectRequest] = useState(false)
  const [walletConnectRequestInfo, setWalletConnectRequestInfo] = useState<
    any | null
  >(false)
  // const [showExpandedMessage, setShowExpandedMessage] = useState(false)
  const [currentPageMeta, setCurrentPageMeta] = useState({})
  const wallet = useWalletContext().wallet
  const { gasPrice } = useGasPrice()

  const [signMessageParams, setSignMessageParams] = useState<Action>()
  // const [signType, setSignType] = useState<any | null>(false)
  // const [customNetworkToAdd, setCustomNetworkToAdd] = useState(null)
  // const [customNetworkToSwitch, setCustomNetworkToSwitch] = useState(null)
  //
  // const [hostToApprove, setHostToApprove] = useState(null)
  //
  // const [watchAsset, setWatchAsset] = useState(false)
  // const [suggestedAssetMeta, setSuggestedAssetMeta] = useState(undefined)

  const initializeWalletConnect = () => {
    WalletConnect.hub.on('walletconnectSessionRequest', peerInfo => {
      setWalletConnectRequest(true)
      setWalletConnectRequestInfo(peerInfo)
    })
    WalletConnect.hub.on('walletconnectCallRequest', payload => {
      setWalletConnectRequestInfo(payload)
      InteractionManager.runAfterInteractions(() => {
        setCurrentPageMeta(payload)
        const { method } = payload
        switch (method) {
          case MessageType.ETH_SEND:
            setShowPendingApproval(true)
            break
          case MessageType.ETH_SIGN:
          case MessageType.SIGN_TYPED_DATA:
          case MessageType.SIGN_TYPED_DATA_V1:
          case MessageType.SIGN_TYPED_DATA_V3:
          case MessageType.SIGN_TYPED_DATA_V4:
          case MessageType.PERSONAL_SIGN: {
            const displayData = paramsToMessageParams(payload)
            setSignMessageParams({ ...payload, displayData })
          }
        }
      })
    })
    WalletConnect.init()
  }

  // const showPendingApprovalModal = ({
  //   type,
  //   origin
  // }: {
  //   type: MessageType
  //   origin: DEEPLINKS
  // }) => {
  //   InteractionManager.runAfterInteractions(() => {
  //     setShowPendingApproval({ type, origin })
  //   })
  // }

  // const onUnapprovedMessage = (
  //   messageParams: any,
  //   type: MessageType,
  //   origin: DEEPLINKS
  // ) => {
  //   setCurrentPageMeta(messageParams.meta)
  //   const signMessageParams = { ...messageParams }
  //   delete signMessageParams.meta
  //   // setSignMessageParams(signMessageParams)
  //   // setSignType(type)
  //   showPendingApprovalModal({
  //     type: MessageType.SIGN_TYPED_DATA,
  //     origin: origin
  //   })
  // }

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

  const onWalletConnectSessionApproval = () => {
    const { peerId } = walletConnectRequestInfo
    setWalletConnectRequest(false)
    setWalletConnectRequestInfo({})
    WalletConnect.hub.emit('walletconnectSessionRequest::approved', peerId)
  }

  const onWalletConnectSessionRejected = () => {
    const peerId = walletConnectRequestInfo.peerId
    setWalletConnectRequest(false)
    setWalletConnectRequestInfo({})
    WalletConnect.hub.emit('walletconnectSessionRequest::rejected', peerId)
  }

  const onWalletConnectCallApproval = async () => {
    try {
      const { id } = walletConnectRequestInfo
      const { method, params } = currentPageMeta
      let hash
      const { data } = params[0]
      if (method === MessageType.ETH_SEND) {
        const gas = parseInt(params[0].gas)
        hash = await wallet?.sendCustomEvmTx(
          gasPrice.bn,
          gas,
          data,
          params[0].to,
          params[0].value
        )
        setWalletConnectRequestInfo({})
      } else {
        const pData = signMessageParams?.displayData.data
        hash = await signMessage(method as MessageType, pData)
      }
      onSignAction()
      WalletConnect.hub.emit('walletconnectCallRequest::approved', {
        id,
        hash
      })
    } catch (e) {
      console.log('error approving', e)
    }
  }

  const onWalletConnectCallRejected = () => {
    const peerId = walletConnectRequestInfo.peerId
    onSignAction()
    WalletConnect.hub.emit('walletconnectCallRequest::rejected', peerId)
  }

  const onSignAction = () => {
    setShowPendingApproval(false)
    setSignMessageParams(undefined)
  }

  // const toggleExpandedMessage = () =>
  //   setShowExpandedMessage(!showExpandedMessage)

  useEffect(() => {
    initializeWalletConnect()
  }, [])

  function renderSigningModal() {
    return (
      <Modal
        visible={showPendingApproval}
        animationType="slide"
        style={styles.bottomModal}
        onDismiss={onSignAction}>
        <TransactionSummary
          onCancel={onWalletConnectCallRejected}
          onConfirm={onWalletConnectCallApproval}
          payload={currentPageMeta}
          walletConnectRequest
        />
      </Modal>
    )
  }

  function renderWalletConnectSessionRequestModal() {
    const meta = walletConnectRequestInfo.peerMeta || null
    return (
      <Modal
        visible={walletConnectRequest}
        animationType="slide"
        style={styles.bottomModal}
        onDismiss={onWalletConnectSessionRejected}>
        <AccountApproval
          onCancel={onWalletConnectSessionRejected}
          onConfirm={onWalletConnectSessionApproval}
          currentPageInformation={{
            title: meta && meta.name,
            url: meta && meta.url,
            icon: meta && meta.icons[0],
            description: meta && meta.description
          }}
          walletConnectRequest
        />
      </Modal>
    )
  }

  function renderPersonalSignModal() {
    return (
      <Modal
        visible={!!signMessageParams}
        animationType="slide"
        style={styles.bottomModal}
        onDismiss={onWalletConnectCallRejected}>
        {signMessageParams && (
          <SignMessage
            onCancel={onWalletConnectCallRejected}
            onConfirm={onWalletConnectCallApproval}
            action={signMessageParams}
          />
        )}
      </Modal>
    )
  }

  return (
    <>
      {renderSigningModal()}
      {renderWalletConnectSessionRequestModal()}
      {renderPersonalSignModal()}
    </>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    justifyContent: 'center',
    alignContent: 'center',
    margin: 16
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600'
  },
  text: { textAlign: 'center', fontSize: 18, marginBottom: 16 },
  highlight: {
    fontWeight: '700'
  },
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0
  },
  actionContainer: {
    flex: 0,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24
  }
})

export default RpcMethodsUI
