import React, { useCallback, useEffect } from 'react'
import { ScrollView, View } from 'react-native'
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
import { bnToLocaleString } from '@avalabs/utils-sdk'
import PoppableGasAndLimit from 'components/PoppableGasAndLimit'
import { ActivityIndicator } from 'components/ActivityIndicator'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { Tooltip } from 'components/Tooltip'
import { useAnalytics } from 'hooks/useAnalytics'

type NavigationProp = SendTokensScreenProps<
  typeof AppNavigation.Send.Review
>['navigation']

export default function ReviewSend({
  onSuccess
}: {
  onSuccess: () => void
}): JSX.Element {
  const { theme } = useApplicationContext()
  const { goBack } = useNavigation<NavigationProp>()
  const { capture } = useAnalytics()
  const {
    sendToken,
    sendAmountInCurrency,
    tokenLogo,
    sendAmount,
    fees,
    fromAccount,
    toAccount,
    onSendNow,
    sendStatus,
    sendStatusMsg
  } = useSendTokenContext()

  function handleSend(): void {
    onSendNow()
  }

  useEffect(() => {
    if (sendStatus === 'Sending') {
      onSuccess()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendStatus])

  useBeforeRemoveListener(
    useCallback(() => {
      capture('SendCancel')
    }, [capture]),
    [RemoveEvents.GO_BACK]
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
            <AvaText.Heading1 testID="review_and_send__amount">
              {formatLargeNumber(sendAmount.amount, 4)}
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
          testID="review_and_send__from"
          label={'From'}
          title={fromAccount.title}
          address={fromAccount.address}
        />
        <SendRow
          testID="review_and_send__to"
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
          <AvaText.Heading2 testID="review_and_send__network_fee" currency>
            {fees.sendFeeInCurrency}
          </AvaText.Heading2>
        </Row>
        <Space y={16} />
        <Separator />
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Balance After Transaction</AvaText.Body2>
          <AvaText.Heading2 testID="review_and_send__bal_after_transaction">
            {fromAccount.balanceAfterTrx} {sendToken?.symbol ?? ''}
          </AvaText.Heading2>
        </Row>
        <AvaText.Body3 textStyle={{ alignSelf: 'flex-end' }} currency>
          {fromAccount.balanceAfterTrxInCurrency}
        </AvaText.Body3>
        <FlexSpacer />
        {sendStatus === 'Idle' && (
          <>
            <AvaButton.PrimaryLarge
              onPress={handleSend}
              testID="review_and_send__send_now_button">
              Send Now
            </AvaButton.PrimaryLarge>
            <Space y={16} />
            <AvaButton.SecondaryLarge
              onPress={() => goBack()}
              testID="review_and_send__cancel_button">
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
