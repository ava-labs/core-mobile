import React, { useEffect } from 'react'
import AccountApproval from 'screens/rpc/components/AccountApproval'
import SignTransaction from 'screens/rpc/components/SignTransaction'
import SignMessage from 'screens/rpc/components/SignMessage/SignMessage'
import { RPC_EVENT } from 'screens/rpc/util/types'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import { useNavigation } from '@react-navigation/native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import TabViewBackground from 'components/TabViewBackground'

const snapPoints = ['90%']

const RpcMethodsUI = () => {
  const { goBack } = useNavigation()
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
    if (dappEvent === undefined) {
      goBack()
    } else if (!dappEvent.handled) {
      setEventHandled(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dappEvent])

  function renderSignTransaction() {
    return (
      <SignTransaction
        onReject={onCallRejected}
        onApprove={onTransactionCallApproved}
        dappEvent={dappEvent}
        onClose={goBack}
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
        onClose={goBack}
      />
    )
  }

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      animateOnMount
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundComponent={TabViewBackground}
      enableContentPanningGesture={false}
      onClose={goBack}>
      {(dappEvent?.eventType === RPC_EVENT.SIGN && renderSignMessage()) ||
        (dappEvent?.eventType === RPC_EVENT.SESSION &&
          renderSessionRequest()) ||
        (dappEvent?.eventType === RPC_EVENT.TRANSACTION &&
          renderSignTransaction())}
    </BottomSheet>
  )
}

export default RpcMethodsUI
