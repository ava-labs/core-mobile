import React, { useCallback, useEffect } from 'react'
import { View } from 'react-native'
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
import { Popable } from 'react-native-popable'
import { bnToLocaleString } from '@avalabs/utils-sdk'
import PoppableGasAndLimit from 'components/PoppableGasAndLimit'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { usePosthogContext } from 'contexts/PosthogContext'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'

type NavigationProp = SendTokensScreenProps<
  typeof AppNavigation.Send.Review
>['navigation']

export default function ReviewSend({ onSuccess }: { onSuccess: () => void }) {
  const { theme } = useApplicationContext()
  const { goBack } = useNavigation<NavigationProp>()
  const { capture } = usePosthogContext()
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

  function handleSend() {
    onSendNow()
  }

  useEffect(() => {
    if (sendStatus === 'Sending') {
      onSuccess()
    }
  }, [sendStatus])

  useBeforeRemoveListener(
    useCallback(() => {
      capture('SendCancel')
    }, [capture]),
    [RemoveEvents.GO_BACK]
  )

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
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Popable
            content={
              <PoppableGasAndLimit
                gasLimit={fees.gasLimit ?? 0}
                gasPrice={bnToLocaleString(fees.customGasPrice)}
              />
            }
            position={'right'}
            style={{ minWidth: 200 }}
            backgroundColor={theme.colorBg3}>
            <AvaText.Body2>Network Fee ⓘ</AvaText.Body2>
          </Popable>
          <AvaText.Heading2 currency>{fees.sendFeeInCurrency}</AvaText.Heading2>
        </Row>
        <Space y={16} />
        <Separator />
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Balance After Transaction</AvaText.Body2>
          <AvaText.Heading2>
            {fromAccount.balanceAfterTrx} {sendToken?.symbol ?? ''}
          </AvaText.Heading2>
        </Row>
        <AvaText.Body3 textStyle={{ alignSelf: 'flex-end' }} currency>
          {fromAccount.balanceAfterTrxInCurrency}
        </AvaText.Body3>
        <FlexSpacer />
        {sendStatus === 'Idle' && (
          <>
            <AvaButton.PrimaryLarge onPress={handleSend}>
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
    </View>
  )
}
