import React, { FC, useEffect, useState } from 'react'
import { InteractionManager, StyleSheet, View } from 'react-native'
import WalletConnect from 'WalletConnect'
import AccountApproval from 'screens/rpc/AccountApproval'
import SignTransaction from 'screens/rpc/SignTransaction'
import { Action, MessageType } from 'navigation/messages/models'
import { useAccountsContext } from '@avalabs/wallet-react-components'
import { useGasPrice } from 'utils/GasPriceHook'
import { paramsToMessageParams } from 'rpc/paramsToMessageParams'
import SignMessage from 'screens/rpc/SignMessage/SignMessage'
import BottomSheet from 'components/BottomSheet'
import { ShowSnackBar } from 'components/Snackbar'
import Spinner from 'components/Spinner'
import { txToCustomEvmTx } from 'rpc/txToCustomEvmTx'

const RpcMethodsUI: FC = () => {
  const [signingCallRequest, setSigningCallRequest] = useState(false)
  const [transactionCallRequest, setTransactionCallRequest] = useState(false)
  const [callRequestPayload, setCallRequestPayload] = useState<any>({})
  const [signMessageParams, setSignMessageParams] = useState<Action>()
  const [dappConnectionRequest, setDappConnectionRequest] = useState(false)
  const [currentPageMeta, setCurrentPageMeta] = useState<any>({})
  const { activeAccount } = useAccountsContext()
  const wallet = activeAccount?.wallet
  const { gasPrice } = useGasPrice()

  const [loading, setLoading] = useState(false)

  const initializeWalletConnect = () => {
    WalletConnect.hub.on('walletconnectSessionRequest', peerInfo => {
      setCurrentPageMeta(peerInfo)
      setDappConnectionRequest(true)
    })
    WalletConnect.hub.on('walletconnectCallRequest', data => {
      const { payload, peerMeta } = data
      InteractionManager.runAfterInteractions(() => {
        setCurrentPageMeta(peerMeta)
        setCallRequestPayload(payload)
        const { method } = payload
        switch (method) {
          case MessageType.ETH_SEND:
            setTransactionCallRequest(true)
            break
          case MessageType.ETH_SIGN:
          case MessageType.SIGN_TYPED_DATA:
          case MessageType.SIGN_TYPED_DATA_V1:
          case MessageType.SIGN_TYPED_DATA_V3:
          case MessageType.SIGN_TYPED_DATA_V4:
          case MessageType.PERSONAL_SIGN: {
            const displayData = paramsToMessageParams(payload)
            setSignMessageParams({ ...payload, displayData })
            setSigningCallRequest(true)
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
    const { peerId } = currentPageMeta
    setDappConnectionRequest(false)
    setCurrentPageMeta({})
    WalletConnect.hub.emit('walletconnectSessionRequest::approved', peerId)
    ShowSnackBar('You can now go back to the browser')
  }

  const onWalletConnectSessionRejected = () => {
    const { peerId } = currentPageMeta
    setDappConnectionRequest(false)
    setCurrentPageMeta({})
    WalletConnect.hub.emit('walletconnectSessionRequest::rejected', peerId)
  }

  const onWalletConnectCallApproval = async (customParams: any) => {
    setLoading(true)
    try {
      const { id, method, params } = callRequestPayload
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
            WalletConnect.hub.emit('walletconnectCallRequest::approved', {
              id,
              hash
            })

            onSignAction()
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
        setCallRequestPayload({})
      } else {
        const pData = signMessageParams?.displayData.data
        hash = await signMessage(method as MessageType, pData)
      }
      // onSignAction()
      // WalletConnect.hub.emit('walletconnectCallRequest::approved', {
      //   id,
      //   hash
      // })
    } catch (e) {
      ShowSnackBar('An error occurred. Go back to the browser')
      console.log('error approving', e)
    } finally {
      setLoading(false)
    }
  }

  const onWalletConnectCallRejected = () => {
    WalletConnect.hub.emit(
      'walletconnectCallRequest::rejected',
      callRequestPayload.peerId
    )
    onSignAction()
  }

  const onSignAction = () => {
    setSigningCallRequest(false)
    setSignMessageParams(undefined)
    setCallRequestPayload({})
    setTransactionCallRequest(false)
  }

  useEffect(() => {
    initializeWalletConnect()
  }, [])

  function renderTransactionApproval() {
    return (
      <BottomSheet
        snapPoints={['0%', '90%']}
        snapTo={transactionCallRequest ? 1 : 0}
        disablePanningGesture
        children={
          transactionCallRequest && (
            <SignTransaction
              onCancel={onWalletConnectCallRejected}
              onConfirm={onWalletConnectCallApproval}
              payload={callRequestPayload}
              peerMeta={currentPageMeta}
            />
          )
        }
      />
    )
  }

  function renderWalletConnectSessionRequestModal() {
    return (
      <BottomSheet
        snapPoints={['0%', '90%']}
        snapTo={dappConnectionRequest ? 1 : 0}
        disablePanningGesture
        children={
          dappConnectionRequest && (
            <AccountApproval
              onCancel={onWalletConnectSessionRejected}
              onConfirm={onWalletConnectSessionApproval}
              currentPageInformation={{
                title: currentPageMeta && currentPageMeta?.peerMeta?.name,
                url: currentPageMeta && currentPageMeta?.peerMeta?.url,
                icon: currentPageMeta && currentPageMeta?.peerMeta?.icons?.[0],
                description:
                  currentPageMeta && currentPageMeta?.peerMeta?.description
              }}
            />
          )
        }
      />
    )
  }

  function renderPersonalSignModal() {
    return (
      <BottomSheet
        snapPoints={['0%', '85%']}
        snapTo={signingCallRequest ? 1 : 0}
        disablePanningGesture
        children={
          signMessageParams && (
            <SignMessage
              onCancel={onWalletConnectCallRejected}
              onConfirm={onWalletConnectCallApproval}
              action={signMessageParams}
            />
          )
        }
      />
    )
  }

  return (
    <>
      {renderTransactionApproval()}
      {renderWalletConnectSessionRequestModal()}
      {renderPersonalSignModal()}
      {loading && (
        <View style={StyleSheet.absoluteFill}>
          <Spinner size={40} />
        </View>
      )}
    </>
  )
}

// const styles = StyleSheet.create({
//   contentContainer: {
//     justifyContent: 'center',
//     alignContent: 'center',
//     margin: 16
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '600'
//   },
//   text: { textAlign: 'center', fontSize: 18, marginBottom: 16 },
//   highlight: {
//     fontWeight: '700'
//   },
//   bottomModal: {
//     justifyContent: 'flex-end',
//     margin: 0
//   },
//   actionContainer: {
//     flex: 0,
//     flexDirection: 'row',
//     paddingVertical: 16,
//     paddingHorizontal: 24
//   }
// })

export default RpcMethodsUI
