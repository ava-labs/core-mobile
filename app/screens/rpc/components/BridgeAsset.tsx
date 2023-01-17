import React, { FC, useContext, useEffect, useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { humanize } from 'utils/string/humanize'
import { AvalancheBridgeAssetRequest } from 'store/walletConnect/handlers/avalanche_bridgeAsset'
import Avatar from 'components/Avatar'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import SimplePrompt from './SimplePrompt'

interface Props {
  dappEvent: AvalancheBridgeAssetRequest
  onApprove: (request: AvalancheBridgeAssetRequest) => void
  onReject: (request: AvalancheBridgeAssetRequest, message?: string) => void
  onClose: (request: AvalancheBridgeAssetRequest) => void
}

const BridgeAsset: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose
}) => {
  const [submitting, setSubmitting] = useState(false)
  const theme = useContext(ApplicationContext).theme
  const {
    payload: { peerMeta },
    data: { amountStr, asset, currentBlockchain }
  } = dappEvent

  const symbol = asset.symbol

  const header = 'Approve Action'

  const description =
    new URL(peerMeta?.url ?? '').hostname +
    ' wants to perform the following action'

  useEffect(() => {
    if (dappEvent.error || dappEvent.result) {
      setSubmitting(false)
    }
    if (dappEvent.error) {
      showSnackBarCustom({
        component: (
          <TransactionToast
            type={TransactionToastType.ERROR}
            message={'Failed to approve transaction'}
          />
        ),
        duration: 'short'
      })
      onClose(dappEvent)
    }
  }, [dappEvent, onClose])

  const onHandleApprove = () => {
    setSubmitting(true)
    onApprove(dappEvent)
  }

  const renderIcon = () => (
    <Avatar.Custom
      name={peerMeta?.name ?? ''}
      size={48}
      logoUri={peerMeta?.icons[0]}
    />
  )

  const renderContent = () => {
    return (
      <View style={{ flexShrink: 1 }}>
        <AvaText.Body1
          color={theme.colorError}
          textStyle={{ alignSelf: 'center' }}>
          Core wants to bridge
        </AvaText.Body1>
        <Space y={8} />
        <AvaText.Body2>Message:</AvaText.Body2>
        <Space y={8} />
        <ScrollView
          style={{
            flexGrow: 1,
            backgroundColor: theme.colorBg3,
            borderRadius: 8,
            padding: 8
          }}>
          <AvaText.Body1>{`You are about to bridge ${amountStr} ${symbol} on ${humanize(
            currentBlockchain
          )} Network`}</AvaText.Body1>
        </ScrollView>
      </View>
    )
  }

  return (
    <SimplePrompt
      onApprove={onHandleApprove}
      onReject={() => {
        onReject(dappEvent)
        onClose(dappEvent)
      }}
      header={header}
      description={description}
      renderIcon={renderIcon}
      renderContent={renderContent}
      isApproving={submitting}
    />
  )
}

export default BridgeAsset
