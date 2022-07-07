import React, { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import AccountApproval from 'screens/rpc/components/AccountApproval'
import SignTransaction from 'screens/rpc/components/SignTransaction'
import SignMessage from 'screens/rpc/components/SignMessage/SignMessage'
import BottomSheet from 'components/BottomSheet'
import Spinner from 'components/Spinner'
import { useRpcTxHandler } from 'screens/rpc/useRpcTxHandler'
import { RPC_EVENT } from 'screens/rpc/util/types'

const RpcMethodsUI: FC = () => {
  const {
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
  } = useRpcTxHandler()

  // const onWalletConnectCallApproval = async (customParams: any) => {
  //   await onCallApproved(customParams)
  // }
  //
  // const onWalletConnectCallRejected = () => {
  //   onCallRejected()
  // }

  function renderTransactionApproval() {
    const isEventTx = eventType === RPC_EVENT.TRANSACTION
    return (
      <BottomSheet
        snapPoints={['0%', '90%']}
        snapTo={isEventTx ? 1 : 0}
        disablePanningGesture
        children={
          isEventTx && (
            <SignTransaction
              onReject={onCallRejected}
              onApprove={onCallApproved}
              txParams={currentPayload?.params[0]}
              peerMeta={currentPeerMeta}
              loading={loading}
              hash={hash}
            />
          )
        }
      />
    )
  }

  function renderSessionRequest() {
    const isEventSession = eventType === RPC_EVENT.SESSION
    return (
      <BottomSheet
        snapPoints={['0%', '90%']}
        snapTo={isEventSession ? 1 : 0}
        disablePanningGesture
        children={
          isEventSession && (
            <AccountApproval
              onReject={onSessionRejected}
              onApprove={onSessionApproved}
              peerMeta={currentPeerMeta}
            />
          )
        }
      />
    )
  }

  function renderPersonalSign() {
    const isEventSign = eventType === RPC_EVENT.SESSION
    return (
      <BottomSheet
        snapPoints={['0%', '75%']}
        snapTo={isEventSign ? 1 : 0}
        disablePanningGesture
        children={
          signMessageParams &&
          isEventSign && (
            <SignMessage
              onRejected={onCallRejected}
              onApproved={onCallApproved}
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
      {renderSessionRequest()}
      {renderPersonalSign()}
    </>
  )
}

export default RpcMethodsUI
