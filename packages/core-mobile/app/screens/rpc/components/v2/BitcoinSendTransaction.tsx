import React, { useCallback, useMemo, useState } from 'react'
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
import { Eip1559Fees } from 'utils/Utils'
import SendRow from 'components/SendRow'
import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { NetworkTokenUnit } from 'types'
import { getBitcoinNetwork } from 'services/network/utils/providerUtils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { TokenBaseUnit } from 'types/TokenBaseUnit'
import { BN } from 'bn.js'
import { selectTokensWithBalanceByNetwork } from 'store/balance'
import { mustNumber } from 'utils/JsTools'
import { satoshiToBtc } from '@avalabs/bridge-sdk'

type BitcoinSendTransactionScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.BitcoinSendTransaction
>

const BitcoinSendTransaction = (): JSX.Element => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const activeAccount = useSelector(selectActiveAccount)
  const {
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()
  const {
    theme: { colors }
  } = useTheme()
  const { goBack } =
    useNavigation<BitcoinSendTransactionScreenProps['navigation']>()
  const { request, data } =
    useRoute<BitcoinSendTransactionScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const btcNetwork = getBitcoinNetwork(isDeveloperMode)

  const { sendState, balance } = data

  const [maxFeePerGas, setMaxFeePerGas] = useState<
    TokenBaseUnit<NetworkTokenUnit>
  >(NetworkTokenUnit.fromNetwork(btcNetwork, sendState.maxFeePerGas ?? 0))

  const tokens = useSelector(selectTokensWithBalanceByNetwork(btcNetwork))

  const btcToken = tokens.find(t => t.symbol === 'BTC')
  const tokenPriceInSelectedCurrency = btcToken?.priceInCurrency ?? 0
  const amountInBtc = satoshiToBtc(Number(sendState.amount) ?? 0)
  const sendAmountInCurrency =
    Number(amountInBtc) * tokenPriceInSelectedCurrency

  const balanceAfterTrx = useMemo(() => {
    let balanceBN = btcToken?.balance
    if (activeAccount?.addressBtc !== sendState.address) {
      balanceBN = balanceBN?.sub(sendState.amount ?? new BN(0))
    }
    return NetworkTokenUnit.fromNetwork(btcNetwork, balanceBN)
      .sub(maxFeePerGas.mul(sendState.gasLimit ?? 0))
      .toFixed(4)
  }, [
    activeAccount?.addressBtc,
    btcNetwork,
    btcToken?.balance,
    maxFeePerGas,
    sendState.address,
    sendState.amount,
    sendState.gasLimit
  ])

  const balanceAfterTrxInCurrency = useMemo(
    () =>
      (
        tokenPriceInSelectedCurrency *
        mustNumber(() => parseFloat(balanceAfterTrx), 0)
      ).toFixed(2),
    [balanceAfterTrx, tokenPriceInSelectedCurrency]
  )

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const onHandleApprove = (): void => {
    onApprove(request, {
      sendState: { ...sendState, maxFeePerGas: maxFeePerGas.toSubUnit() },
      balance
    })
    goBack()
  }

  const handleFeeChange = useCallback(
    (fees: Eip1559Fees<NetworkTokenUnit>) => {
      setMaxFeePerGas(fees.maxFeePerGas)
    },
    [setMaxFeePerGas]
  )

  return (
    <>
      <RpcRequestBottomSheet onClose={rejectAndClose}>
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
              <DotSVG fillColor={colors.$black} size={72} />
            </View>
            <Image
              style={{ width: 57, height: 57 }}
              source={{
                uri: formatUriImageToPng(btcNetwork.networkToken.logoUri, 57)
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
                <Text variant="heading4" sx={{ lineHeight: 29 }}>
                  {Number(amountInBtc)}
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
                {tokenInCurrencyFormatter(sendAmountInCurrency)}
              </Text>
            </Row>
            <Space y={8} />
            <SendRow
              label={'From'}
              title={activeAccount?.title ?? ''}
              address={activeAccount?.addressBtc ?? ''}
            />
            <SendRow
              label={'To'}
              title={'Address'}
              address={sendState.address ?? ''}
            />
            <Space y={8} />
            <NetworkFeeSelector
              chainId={btcNetwork.chainId}
              gasLimit={sendState.gasLimit ?? 0}
              onFeesChange={handleFeeChange}
              maxNetworkFee={NetworkTokenUnit.fromNetwork(btcNetwork)}
            />

            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="body2" sx={{ color: '$neutral400' }}>
                Balance After Transaction
              </Text>
              <Text
                variant="heading6"
                sx={{ color: '$neutral50', fontSize: 18, lineHeight: 22 }}>
                {balanceAfterTrx} {btcToken?.symbol ?? ''}
              </Text>
            </Row>
            <Text
              variant="caption"
              sx={{
                color: '$neutral50',
                alignSelf: 'flex-end',
                lineHeight: 15
              }}>
              {tokenInCurrencyFormatter(balanceAfterTrxInCurrency)}
            </Text>
            <FlexSpacer />
            <Button type="primary" size="xlarge" onPress={onHandleApprove}>
              Approve
            </Button>
            <Space y={16} />
            <Button type="secondary" size="xlarge" onPress={rejectAndClose}>
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
