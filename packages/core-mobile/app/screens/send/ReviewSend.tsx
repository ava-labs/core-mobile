import React, { useCallback, useEffect } from 'react'
import { ScrollView } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { useNavigation } from '@react-navigation/native'
import DotSVG from 'components/svg/DotSVG'
import Separator from 'components/Separator'
import { Row } from 'components/Row'
import FlexSpacer from 'components/FlexSpacer'
import { useSendTokenContext } from 'contexts/SendTokenContext'
import AppNavigation from 'navigation/AppNavigation'
import { SendTokensScreenProps } from 'navigation/types'
import { formatLargeNumber } from 'utils/Utils'
import SendRow from 'components/SendRow'
import PoppableGasAndLimit from 'components/PoppableGasAndLimit'
import { ActivityIndicator } from 'components/ActivityIndicator'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Button, Text, View } from '@avalabs/k2-mobile'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'

type NavigationProp = SendTokensScreenProps<
  typeof AppNavigation.Send.Review
>['navigation']

export default function ReviewSend({
  onSuccess
}: {
  onSuccess: () => void
}): JSX.Element {
  const {
    theme,
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { activeNetwork } = useNetworks()
  const isBtcNetwork = Boolean(activeNetwork?.vmName === NetworkVMType.BITCOIN)
  const { goBack } = useNavigation<NavigationProp>()
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

  const maxFeePerGas = isBtcNetwork
    ? fees.maxFeePerGas.toSubUnit().toString()
    : fees.maxFeePerGas.toFeeUnit()

  const maxPriorityFeePerGas = isBtcNetwork
    ? fees.maxPriorityFeePerGas.toSubUnit().toString()
    : fees.maxPriorityFeePerGas.toFeeUnit()

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
      AnalyticsService.capture('SendCancel')
    }, []),
    [RemoveEvents.GO_BACK]
  )

  return (
    <ScrollView contentContainerStyle={{ minHeight: '100%' }}>
      <Text variant="heading3" sx={{ marginHorizontal: 16, fontSize: 36 }}>
        Send
      </Text>
      <View
        sx={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: -36,
          zIndex: 2
        }}>
        <View sx={{ position: 'absolute' }}>
          <DotSVG fillColor={theme.colorBg1} size={72} />
        </View>
        {tokenLogo()}
      </View>
      <View
        sx={{
          backgroundColor: '$neutral900',
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 16,
          flex: 1,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            variant="body2"
            sx={{ textAlign: 'center', color: '$neutral400' }}>
            Amount
          </Text>
          <Row style={{ alignItems: 'baseline' }}>
            <Text
              testID="review_and_send__amount"
              variant="heading4"
              sx={{ lineHeight: 29 }}>
              {formatLargeNumber(sendAmount.amount, 4)}
            </Text>
            <Space x={4} />
            <Text
              variant="subtitle1"
              sx={{ lineHeight: 24, color: '$neutral400' }}>
              {sendToken?.symbol ?? ''}
            </Text>
          </Row>
        </Row>
        <Row style={{ justifyContent: 'flex-end' }}>
          <Text
            variant="subtitle1"
            sx={{ lineHeight: 24, color: '$neutral400' }}>
            {currencyFormatter(sendAmountInCurrency ?? 0)}
          </Text>
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
        <Row style={{ justifyContent: 'space-between' }}>
          <Tooltip
            content={
              <PoppableGasAndLimit
                gasLimit={fees.gasLimit ?? 0}
                maxFeePerGas={maxFeePerGas}
                maxPriorityFeePerGas={maxPriorityFeePerGas}
              />
            }
            position={'right'}
            style={{ width: 250 }}>
            Network Fee
          </Tooltip>
          <View sx={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <Text sx={{ color: '$neutral50' }}>
              {`${fees?.sendFeeNative} ${activeNetwork.networkToken.symbol}`}
            </Text>
            <Text variant="body1" sx={{ color: '$neutral400' }}>
              {currencyFormatter(fees?.sendFeeInCurrency ?? 0)}
            </Text>
          </View>
        </Row>
        <Space y={16} />
        <Separator />
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="body2" sx={{ color: '$neutral400' }}>
            Balance After Transaction
          </Text>
          <Text
            variant="heading6"
            testID="review_and_send__bal_after_transaction"
            sx={{ color: '$neutral50', fontSize: 18, lineHeight: 22 }}>
            {fromAccount.balanceAfterTrx} {sendToken?.symbol ?? ''}
          </Text>
        </Row>
        <Text
          variant="caption"
          sx={{ color: '$neutral50', alignSelf: 'flex-end', lineHeight: 15 }}>
          {currencyFormatter(fromAccount.balanceAfterTrxInCurrency ?? 0)}
        </Text>
        <FlexSpacer />
        {sendStatus === 'Idle' && (
          <>
            <Button
              type="primary"
              size="xlarge"
              onPress={handleSend}
              testID="review_and_send__send_now_button">
              Send Now
            </Button>
            <Space y={16} />
            <Button
              type="secondary"
              size="xlarge"
              onPress={() => goBack()}
              testID="review_and_send__cancel_button">
              Cancel
            </Button>
          </>
        )}
        {sendStatus === 'Preparing' && (
          <>
            <ActivityIndicator size="large" />
            <Space y={32} />
          </>
        )}
        {sendStatus === 'Fail' && (
          <Text variant="body2" sx={{ color: '$dangerMain' }}>
            {sendStatusMsg.toString()}
          </Text>
        )}
      </View>
    </ScrollView>
  )
}
