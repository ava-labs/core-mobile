import React, { useCallback, useContext, useEffect } from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { humanize } from 'utils/string/humanize'
import { useSelector } from 'react-redux'
import Avatar from 'components/Avatar'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import { selectRequestStatus } from 'store/walletConnect'
import SimplePrompt from './SimplePrompt'

type BridgeAssetScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.BridgeAsset
>

const BridgeAsset = () => {
  const { goBack } = useNavigation<BridgeAssetScreenProps['navigation']>()

  const { request, asset, amountStr, currentBlockchain } =
    useRoute<BridgeAssetScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionContext()

  const requestStatus = useSelector(selectRequestStatus(request.payload.id))

  const theme = useContext(ApplicationContext).theme
  const {
    payload: { peerMeta }
  } = request

  const symbol = asset.symbol

  const header = 'Approve Action'

  const description =
    new URL(peerMeta?.url ?? '').hostname +
    ' wants to perform the following action'

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { currentBlockchain, amountStr, asset })
    goBack()
  }, [amountStr, asset, currentBlockchain, goBack, onApprove, request])

  useEffect(() => {
    if (!requestStatus) return

    if (requestStatus.error) {
      showSnackBarCustom({
        component: (
          <TransactionToast
            type={TransactionToastType.ERROR}
            message={'Failed to approve transaction'}
          />
        ),
        duration: 'long'
      })
      goBack()
    }
  }, [requestStatus, goBack])

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
      onApprove={approveAndClose}
      onReject={rejectAndClose}
      header={header}
      description={description}
      renderIcon={renderIcon}
      renderContent={renderContent}
    />
  )
}

export default BridgeAsset
