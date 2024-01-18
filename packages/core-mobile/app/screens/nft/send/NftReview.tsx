import React, { useCallback, useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import AvaText from 'components/AvaText'
import DotSVG from 'components/svg/DotSVG'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Avatar from 'components/Avatar'
import AppNavigation from 'navigation/AppNavigation'
import FlexSpacer from 'components/FlexSpacer'
import AvaButton from 'components/AvaButton'
import SendRow from 'components/SendRow'
import { useSendNFTContext } from 'contexts/SendNFTContext'
import { useNavigation } from '@react-navigation/native'
import { NFTDetailsSendScreenProps } from 'navigation/types'
import { ActivityIndicator } from 'components/ActivityIndicator'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { Row } from 'components/Row'
import PoppableGasAndLimit from 'components/PoppableGasAndLimit'
import { bnToLocaleString } from '@avalabs/utils-sdk'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'

type NavigationProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.Review
>['navigation']

export type NftReviewScreenProps = {
  onSuccess: () => void
}

export default function NftReview({
  onSuccess
}: NftReviewScreenProps): JSX.Element {
  const { theme } = useApplicationContext()
  const { goBack } = useNavigation<NavigationProp>()
  const {
    sendToken: nft,
    sendStatus,
    onSendNow,
    sendStatusMsg,
    toAccount,
    fromAccount,
    fees
  } = useSendNFTContext()

  useEffect(() => {
    if (sendStatus === 'Sending') {
      onSuccess()
    }
  }, [onSuccess, sendStatus])

  useBeforeRemoveListener(
    useCallback(() => {
      AnalyticsService.capture('SendCancel')
    }, []),
    [RemoveEvents.GO_BACK, RemoveEvents.POP]
  )

  return (
    <ScrollView contentContainerStyle={{ minHeight: '100%' }}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Send
      </AvaText.LargeTitleBold>
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: -36,
          zIndex: 2
        }}>
        <View style={{ position: 'absolute' }}>
          <DotSVG fillColor={theme.colorBg1} size={72} />
        </View>
        <Avatar.Custom
          size={56}
          name={nft.metadata.name ?? ''}
          logoUri={nft.metadata.imageUri}
        />
      </View>
      <View
        style={{
          backgroundColor: theme.colorBg2,
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 16,
          flex: 1,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
        <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
          Collectible
        </AvaText.Body2>
        <Space y={4} />
        <AvaText.Heading1 textStyle={{ alignSelf: 'center' }}>
          #{nft.tokenId}
        </AvaText.Heading1>
        <Space y={4} />
        <AvaText.Heading3 textStyle={{ alignSelf: 'center' }}>
          {nft.metadata.name}
        </AvaText.Heading3>
        <Space y={18} />
        <SendRow
          label={'From'}
          title={fromAccount.title}
          address={fromAccount.address}
        />
        <Space y={8} />
        <SendRow
          label={'To'}
          title={toAccount.title}
          address={toAccount.address}
        />
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Tooltip
            content={
              <PoppableGasAndLimit
                gasLimit={fees.gasLimit ?? 0}
                gasPrice={bnToLocaleString(fees.customGasPrice)}
              />
            }
            position={'right'}
            style={{ width: 200 }}>
            Network Fee
          </Tooltip>
          <AvaText.Heading2 currency>{fees.sendFeeInCurrency}</AvaText.Heading2>
        </Row>
        <Space y={16} />
        <Separator />
        <FlexSpacer />
        {sendStatus === 'Idle' && (
          <>
            <AvaButton.PrimaryLarge onPress={onSendNow}>
              Send Now
            </AvaButton.PrimaryLarge>
            <Space y={16} />
            <AvaButton.SecondaryLarge onPress={() => goBack()}>
              Cancel
            </AvaButton.SecondaryLarge>
          </>
        )}
        {sendStatus === 'Preparing' && (
          <>
            <ActivityIndicator size="large" />
            <Space y={32} />
          </>
        )}
        {sendStatus === 'Fail' && (
          <>
            <AvaText.Body2 textStyle={{ color: theme.colorError }}>
              {sendStatusMsg.toString()}
            </AvaText.Body2>
          </>
        )}
      </View>
    </ScrollView>
  )
}
