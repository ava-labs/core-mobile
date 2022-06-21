import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { useNavigation } from '@react-navigation/native'
import DotSVG from 'components/svg/DotSVG'
import Separator from 'components/Separator'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import FlexSpacer from 'components/FlexSpacer'
import { useSendTokenContext } from 'contexts/SendTokenContext'
import AppNavigation from 'navigation/AppNavigation'
import { SendTokensScreenProps } from 'navigation/types'
import { formatLargeNumber } from 'utils/Utils'
import SendRow from 'components/SendRow'

type NavigationProp = SendTokensScreenProps<
  typeof AppNavigation.Send.Review
>['navigation']

export default function ReviewSend({
  onSuccess
}: {
  onSuccess: (transactionId: string) => void
}) {
  const { theme } = useApplicationContext()
  const { goBack } = useNavigation<NavigationProp>()
  const {
    sendToken,
    sendAmountInCurrency,
    tokenLogo,
    sendAmount,
    fromAccount,
    toAccount,
    onSendNow,
    sendStatus,
    sendStatusMsg,
    transactionId
  } = useSendTokenContext()

  useEffect(() => {
    switch (sendStatus) {
      case 'Success':
        if (transactionId) {
          onSuccess(transactionId)
        }
    }
  }, [sendStatus, transactionId])

  return (
    <View style={{ flex: 1 }}>
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
        {tokenLogo()}
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
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
            Amount
          </AvaText.Body2>
          <Row style={{ alignItems: 'baseline' }}>
            <AvaText.Heading1>
              {formatLargeNumber(sendAmount, 4)}
            </AvaText.Heading1>
            <Space x={4} />
            <AvaText.Heading3 textStyle={{ color: theme.colorText2 }}>
              {sendToken?.symbol ?? ''}
            </AvaText.Heading3>
          </Row>
        </Row>
        <Row style={{ justifyContent: 'flex-end' }}>
          <AvaText.Heading3 currency textStyle={{ color: theme.colorText2 }}>
            {sendAmountInCurrency}
          </AvaText.Heading3>
        </Row>
        <Space y={8} />
        <SendRow
          label={'From'}
          title={fromAccount.title}
          address={fromAccount.address}
        />
        <SendRow
          label={'To'}
          title={toAccount.title}
          address={toAccount.address}
        />
        <Space y={16} />
        <Separator />
        <Space y={32} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Balance After Transaction</AvaText.Body2>
          <AvaText.Heading2>
            {fromAccount.balanceAfterTrx} {sendToken?.symbol ?? ''}
          </AvaText.Heading2>
        </Row>
        <AvaText.Body3 textStyle={{ alignSelf: 'flex-end' }}>
          ${fromAccount.balanceAfterTrxUsd} USD
        </AvaText.Body3>
        <FlexSpacer />
        {sendStatus !== 'Sending' && (
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
        {sendStatus === 'Sending' && (
          <>
            <ActivityIndicator size="large" color={theme.colorPrimary1} />
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
    </View>
  )
}
