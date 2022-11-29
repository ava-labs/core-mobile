import React, { FC, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import { ScrollView } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import { GenericAction, RpcMethod } from 'services/walletconnect/types'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { AvalancheBridgeAssetRequest } from 'store/rpc/handlers/avalanche_bridgeAsset'
import BridgeAsset from './BridgeAsset'

interface Props {
  dappEvent: AvalancheBridgeAssetRequest
  onReject: (request: AvalancheBridgeAssetRequest, message?: string) => void
  onApprove: (request: AvalancheBridgeAssetRequest) => void
  onClose: (request: AvalancheBridgeAssetRequest) => void
}

const ApproveAction: FC<Props> = ({
  onReject,
  onApprove,
  dappEvent,
  onClose
}) => {
  const theme = useApplicationContext().theme
  const [submitting, setSubmitting] = useState(false)

  const {
    data,
    payload,
    payload: { peerMeta }
  } = dappEvent

  const action: GenericAction = {
    id: payload?.id,
    site: peerMeta,
    method: payload?.method,
    displayData: data
  }

  useEffect(() => {
    if (dappEvent.error || dappEvent.result) {
      setSubmitting(false)
    }

    if (dappEvent.error) {
      console.log('onClose', dappEvent.error)
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

  return (
    <ScrollView contentContainerStyle={styles.scrollView}>
      <AvaText.LargeTitleBold>{'Approve Action'}</AvaText.LargeTitleBold>
      <Space y={30} />
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <OvalTagBg
          style={{
            height: 80,
            width: 80,
            backgroundColor: theme.colorBg3
          }}>
          <Avatar.Custom
            name={action?.site?.name ?? ''}
            size={48}
            logoUri={action?.site?.icons[0]}
          />
        </OvalTagBg>
        <Space y={12} />
        <View style={styles.domainUrlContainer}>
          <AvaText.Body3
            color={theme.colorText1}
            textStyle={{ textAlign: 'center' }}>
            {action?.site?.name} wants to perform the following action
          </AvaText.Body3>
        </View>
        <Space y={18} />
        {
          {
            [RpcMethod.AVALANCHE_BRIDGE_ASSET]: <BridgeAsset action={action} />
          }[action?.method ?? 'unknown']
        }
      </View>
      <FlexSpacer />
      <View style={styles.actionContainer}>
        <AvaButton.PrimaryMedium
          disabled={submitting}
          onPress={onHandleApprove}>
          {submitting && <ActivityIndicator />} Approve
        </AvaButton.PrimaryMedium>
        <Space y={21} />
        <AvaButton.SecondaryMedium
          onPress={() => {
            onReject(dappEvent)
            onClose(dappEvent)
          }}>
          Reject
        </AvaButton.SecondaryMedium>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 42,
    paddingHorizontal: 16,
    flexGrow: 1
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  domainUrlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  }
})

export default ApproveAction
