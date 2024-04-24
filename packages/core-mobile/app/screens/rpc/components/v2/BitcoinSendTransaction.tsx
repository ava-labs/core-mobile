import React, { useCallback } from 'react'
import { Image, StyleSheet } from 'react-native'
import { Space } from 'components/Space'
import FlexSpacer from 'components/FlexSpacer'
import { ScrollView } from 'react-native-gesture-handler'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { useSelector } from 'react-redux'
import { selectIsSeedlessSigningBlocked } from 'store/posthog'
import { selectActiveAccount } from 'store/account'
import { useApplicationContext } from 'contexts/ApplicationContext'
import DotSVG from 'components/svg/DotSVG'
import { formatUriImageToPng } from 'utils/Contentful'
import { Row } from 'components/Row'
import { formatLargeNumber } from 'utils/Utils'
import SendRow from 'components/SendRow'
import { Tooltip } from 'components/Tooltip'
import PoppableGasAndLimit from 'components/PoppableGasAndLimit'
import Separator from 'components/Separator'
import { Button, Text, View } from '@avalabs/k2-mobile'

type BitcoinSendTransactionScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.BitcoinSendTransaction
>

const BitcoinSendTransaction = (): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const activeAccount = useSelector(selectActiveAccount)
  const {
    theme,
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { goBack } =
    useNavigation<BitcoinSendTransactionScreenProps['navigation']>()
  const { request, data } =
    useRoute<BitcoinSendTransactionScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const { sendState } = data

  const tokenPriceInSelectedCurrency = sendState.token?.priceInCurrency ?? 0
  const sendAmountInCurrency =
    tokenPriceInSelectedCurrency * Number(sendState.amount)

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const onHandleApprove = (): void => {
    onApprove(request, data)
    goBack()
  }

  return (
    <>
      <RpcRequestBottomSheet onClose={rejectAndClose}>
        {/* // todo: this is going to be updated as part of the send VM module ticket */}
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
            <Image
              style={{ width: 57, height: 57 }}
              source={{
                uri: formatUriImageToPng(sendState.token?.logoUri ?? '', 57)
              }}
            />
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
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}>
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
                  {formatLargeNumber(Number(sendState.amount), 4)}
                </Text>
                <Space x={4} />
                <Text
                  variant="subtitle1"
                  sx={{ lineHeight: 24, color: '$neutral400' }}>
                  {sendState.token?.symbol ?? ''}
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
              title={activeAccount?.title ?? ''}
              address={activeAccount?.addressBtc ?? ''}
            />
            <SendRow
              testID="review_and_send__to"
              label={'To'}
              title={'Address'}
              address={sendState.address ?? ''}
            />
            <Space y={16} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Tooltip
                content={
                  <PoppableGasAndLimit
                    gasLimit={sendState.gasLimit ?? 0}
                    maxFeePerGas={sendState.maxFeePerGas?.toString() ?? '0'}
                    maxPriorityFeePerGas={
                      sendState.maxPriorityFeePerGas?.toString() ?? '0'
                    }
                  />
                }
                position={'right'}
                style={{ width: 250 }}>
                Network Fee
              </Tooltip>
              <View sx={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                <Text sx={{ color: '$neutral50' }}>
                  {`${sendState.sendFee} ${sendState.token?.symbol}`}
                </Text>
                <Text variant="body1" sx={{ color: '$neutral400' }}>
                  {currencyFormatter(0)}
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
                {activeAccount?.address ?? ''} {sendState.token?.symbol ?? ''}
              </Text>
            </Row>
            <Text
              variant="caption"
              sx={{
                color: '$neutral50',
                alignSelf: 'flex-end',
                lineHeight: 15
              }}>
              {currencyFormatter(0)}
            </Text>
            <FlexSpacer />
            <Button
              type="primary"
              size="xlarge"
              onPress={onHandleApprove}
              testID="review_and_send__send_now_button">
              Send Now
            </Button>
            <Space y={16} />
            <Button
              type="secondary"
              size="xlarge"
              onPress={rejectAndClose}
              testID="review_and_send__cancel_button">
              Cancel
            </Button>
          </View>
        </ScrollView>
      </RpcRequestBottomSheet>
      {isSeedlessSigningBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'Signing is currently under maintenance. Service will resume shortly.'
          }
        />
      )}
    </>
  )
}

export const txStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 14
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 40,
    paddingHorizontal: 14
  }
})

export default BitcoinSendTransaction
