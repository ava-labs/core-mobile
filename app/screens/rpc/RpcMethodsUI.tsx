import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import AccountApproval from 'screens/rpc/components/AccountApproval'
import SignTransaction from 'screens/rpc/components/SignTransaction'
import SignMessage from 'screens/rpc/components/SignMessage/SignMessage'
import { RPC_EVENT } from 'screens/rpc/util/types'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import { useNavigation } from '@react-navigation/native'
import { InteractionManager } from 'react-native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import TabViewBackground from 'components/TabViewBackground'
import { SafeAreaView } from 'react-native-safe-area-context'

const RpcMethodsUI = () => {
  const { goBack } = useNavigation()
  const bottomSheetModalRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['0%', '90%'], [])
  const {
    dappEvent,
    onSessionApproved,
    onSessionRejected,
    onMessageCallApproved,
    onTransactionCallApproved,
    onCallRejected,
    setEventHandled
  } = useDappConnectionContext()

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1)
    }, 100)
  }, [])

  useEffect(() => {
    if (dappEvent === undefined) {
      handleClose()
    } else if (!dappEvent.handled) {
      setEventHandled(true)
    }
  }, [dappEvent])

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close()
    InteractionManager.runAfterInteractions(() => goBack())
  }, [])

  const handleChange = useCallback(index => {
    index === 0 && handleClose()
  }, [])

  function renderSignTransaction() {
    return (
      <SignTransaction
        onReject={onCallRejected}
        onApprove={onTransactionCallApproved}
        dappEvent={dappEvent}
        onClose={handleClose}
      />
    )
  }

  function renderSessionRequest() {
    return (
      <AccountApproval
        onReject={onSessionRejected}
        onApprove={onSessionApproved}
        dappEvent={dappEvent}
      />
    )
  }

  function renderSignMessage() {
    return (
      <SignMessage
        onRejected={onCallRejected}
        onApprove={onMessageCallApproved}
        dappEvent={dappEvent}
        onClose={handleClose}
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
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      ref={bottomSheetModalRef}
      index={1}
      snapPoints={snapPoints}
      backgroundComponent={TabViewBackground}
      enableContentPanningGesture={false}
      onChange={handleChange}>
      <SafeAreaView style={{ flex: 1 }}>
        {(dappEvent?.eventType === RPC_EVENT.SIGN && renderSignMessage()) ||
          (dappEvent?.eventType === RPC_EVENT.SESSION &&
            renderSessionRequest()) ||
          (dappEvent?.eventType === RPC_EVENT.TRANSACTION &&
            renderSignTransaction())}
      </SafeAreaView>
    </BottomSheet>
  )
}

export default RpcMethodsUI
