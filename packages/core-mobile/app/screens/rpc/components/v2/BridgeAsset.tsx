import React, { useCallback, useContext } from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { humanize } from 'utils/string/humanize'
import Avatar from 'components/Avatar'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import SimplePrompt from '../shared/SimplePrompt'

type BridgeAssetScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.BridgeAssetV2
>

const BridgeAsset = () => {
  const { goBack } = useNavigation<BridgeAssetScreenProps['navigation']>()

  const { request, asset, amountStr, currentBlockchain } =
    useRoute<BridgeAssetScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const theme = useContext(ApplicationContext).theme
  const peerMeta = request.session.peer.metadata

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
          color={theme.colorPrimary1}
          textStyle={{ alignSelf: 'center' }}>
          Core wants to bridge
        </AvaText.Body1>
        <Space y={8} />
        <AvaText.Heading3>Message:</AvaText.Heading3>
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
