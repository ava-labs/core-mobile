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
import UpdateContact from './components/UpdateContact'

const snapPoints = ['90%']

const RpcMethodsUI = () => {
  const { goBack } = useNavigation()
  const {
    dappEvent,
    onSessionApproved,
    onSessionRejected,
    onContactUpdated,
    onMessageCallApproved,
    onTransactionCallApproved,
    onCallPromptRejected,
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

  const renderContent = () => {
    if (!dappEvent) return null

    switch (dappEvent.eventType) {
      case RPC_EVENT.SIGN:
        return (
          <SignMessage
            onRejected={onCallPromptRejected}
            onApprove={onMessageCallApproved}
            dappEvent={dappEvent}
            onClose={goBack}
          />
        )
      case RPC_EVENT.SESSION:
        return (
          <AccountApproval
            onReject={onSessionRejected}
            onApprove={onSessionApproved}
            dappEvent={dappEvent}
          />
        )
      case RPC_EVENT.TRANSACTION:
        return (
          <SignTransaction
            onReject={onCallPromptRejected}
            onApprove={onTransactionCallApproved}
            dappEvent={dappEvent}
            onClose={goBack}
          />
        )
      case RPC_EVENT.UPDATE_CONTACT:
        return (
          <UpdateContact
            onReject={onCallPromptRejected}
            onApprove={onContactUpdated}
            dappEvent={dappEvent}
          />
        )
      default:
        return null
    }
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
      {renderContent()}
    </BottomSheet>
  )
}

export default RpcMethodsUI
