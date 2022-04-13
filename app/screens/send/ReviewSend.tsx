import React, { useEffect, useMemo } from 'react'
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
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { useSendTokenContext } from 'contexts/SendTokenContext'
import { StackNavigationProp } from '@react-navigation/stack'
import { SendStackParamList } from 'navigation/wallet/SendScreenStack'
import { useGasPrice } from 'utils/GasPriceHook'
import AppNavigation from 'navigation/AppNavigation'
import SendRow from 'components/SendRow'

export default function ReviewSend({
  onSuccess
}: {
  onSuccess: (transactionId: string) => void
}) {
  const { theme } = useApplicationContext()
  const { goBack } = useNavigation<StackNavigationProp<SendStackParamList>>()
  const {
    sendToken,
    tokenLogo,
    sendAmount,
    fromAccount,
    toAccount,
    fees,
    onSendNow,
    sendStatus,
    sendStatusMsg,
    transactionId
  } = useSendTokenContext()
  const { gasPrice } = useGasPrice()

  const netFeeString = useMemo(() => {
    return fees.sendFeeAvax
      ? Number.parseFloat(fees.sendFeeAvax).toFixed(6).toString()
      : '-'
  }, [fees.sendFeeAvax])

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
        <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
          Amount
        </AvaText.Body2>
        <Space y={4} />
        <Row style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
          <AvaText.Heading1>{sendAmount}</AvaText.Heading1>
          <Space x={4} />
          <AvaText.Heading3>{sendToken?.symbol ?? ''}</AvaText.Heading3>
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
        <Space y={8} />
        <NetworkFeeSelector
          networkFeeAvax={netFeeString}
          networkFeeUsd={`${fees.sendFeeUsd?.toFixed(4)} USD`}
          gasLimitEditorRoute={AppNavigation.Modal.EditGasLimit}
          gasPrice={gasPrice}
          initGasLimit={fees.gasLimit || 0}
          onCustomGasLimit={gasLimit => fees.setGasLimit(gasLimit)}
          onWeightedGas={price => fees.setCustomGasPriceNanoAvax(price.value)}
          weights={{ normal: 1, fast: 1.05, instant: 1.15, custom: 35 }}
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
