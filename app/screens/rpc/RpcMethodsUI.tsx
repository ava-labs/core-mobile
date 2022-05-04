import React, { FC, useEffect, useState } from 'react'
import { DEEPLINKS, MessageType } from 'navigation/messages/models'
import {
  Button,
  InteractionManager,
  Modal,
  StyleSheet,
  Text,
  View
} from 'react-native'
import WalletConnect from 'WalletConnect'
import AccountApproval from 'screens/rpc/AccountApproval'

const RpcMethodsUI: FC = () => {
  const [showPendingApproval, setShowPendingApproval] = useState(false)
  const [signMessageParams, setSignMessageParams] = useState({ data: '' })
  const [signType, setSignType] = useState<any | null>(false)
  const [walletConnectRequest, setWalletConnectRequest] = useState(false)
  const [walletConnectRequestInfo, setWalletConnectRequestInfo] = useState<
    any | null
  >(false)
  const [showExpandedMessage, setShowExpandedMessage] = useState(false)
  const [currentPageMeta, setCurrentPageMeta] = useState({})

  const [customNetworkToAdd, setCustomNetworkToAdd] = useState(null)
  const [customNetworkToSwitch, setCustomNetworkToSwitch] = useState(null)

  const [hostToApprove, setHostToApprove] = useState(null)

  const [watchAsset, setWatchAsset] = useState(false)
  const [suggestedAssetMeta, setSuggestedAssetMeta] = useState(undefined)

  const initializeWalletConnect = () => {
    WalletConnect.hub.on('walletconnectSessionRequest', peerInfo => {
      setWalletConnectRequest(true)
      setWalletConnectRequestInfo(peerInfo)
    })
    WalletConnect.init()
  }

  const showPendingApprovalModal = ({
    type,
    origin
  }: {
    type: MessageType
    origin: DEEPLINKS
  }) => {
    InteractionManager.runAfterInteractions(() => {
      setShowPendingApproval({ type, origin })
    })
  }

  const onUnapprovedMessage = (
    messageParams: any,
    type: MessageType,
    origin: DEEPLINKS
  ) => {
    setCurrentPageMeta(messageParams.meta)
    const signMessageParams = { ...messageParams }
    delete signMessageParams.meta
    setSignMessageParams(signMessageParams)
    setSignType(type)
    showPendingApprovalModal({
      type: MessageType.SIGN_TYPED_DATA,
      origin: origin
    })
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

  const onSignAction = () => setShowPendingApproval(false)

  const toggleExpandedMessage = () =>
    setShowExpandedMessage(!showExpandedMessage)

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
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            padding: 32
          }}>
          <Text style={{ fontSize: 24, paddingVertical: 16, color: 'black' }}>
            Sign
          </Text>
          <View style={styles.actionContainer}>
            <Button
              onPress={() => onWalletConnectSessionRejected()}
              title={'Reject'}
            />
            <Button
              onPress={() => onWalletConnectSessionApproval()}
              title={'Approve'}
            />
          </View>
        </View>
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

  return (
    <>
      {renderSigningModal()}
      {renderWalletConnectSessionRequestModal()}
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
