import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import InputText from 'components/InputText'
import { useSwapContext } from 'contexts/SwapContext'
import { Popable } from 'react-native-popable'
import { useNavigation } from '@react-navigation/native'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { useGasPrice } from 'utils/GasPriceHook'
import { Row } from 'components/Row'
import AppNavigation from 'navigation/AppNavigation'
import { SwapScreenProps } from 'navigation/types'

interface SwapTransactionDetailProps {
  review?: boolean
}

export function popableContent(message: string, backgroundColor: string) {
  return (
    <View
      style={{ padding: 8, backgroundColor: backgroundColor, borderRadius: 8 }}>
      <AvaText.Body3>{message}</AvaText.Body3>
    </View>
  )
}

type NavigationProp =
  | SwapScreenProps<typeof AppNavigation.Swap.Review>['navigation']
  | SwapScreenProps<typeof AppNavigation.Swap.Swap>['navigation']

const SwapTransactionDetail: FC<SwapTransactionDetailProps> = ({
  review = false
}) => {
  const { gasPrice } = useGasPrice()
  const { theme } = useApplicationContext()
  const { trxDetails } = useSwapContext()
  const { navigate } = useNavigation<NavigationProp>()
  const slippageInfoMessage = popableContent(
    'Suggested slippage – your transaction will fail if the price changes unfavorably more than this percentage',
    theme.colorBg3
  )

  const netFeeInfoMessage = popableContent(
    `Gas limit: ${
      trxDetails.gasLimit
    } \nGas price: ${trxDetails.gasPrice.toFixed(2)} nAVAX`,
    theme.colorBg3
  )

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {review || (
        <>
          <Space y={16} />
          <AvaText.Heading3>Transaction details</AvaText.Heading3>
          <Space y={16} />
        </>
      )}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Body2>Rate</AvaText.Body2>
        <AvaText.Heading3>{trxDetails.rate}</AvaText.Heading3>
      </Row>
      <Space y={16} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Popable
          content={slippageInfoMessage}
          position={'right'}
          style={{ minWidth: 200 }}
          backgroundColor={theme.colorBg3}>
          <AvaText.Body2>Slippage tolerance ⓘ</AvaText.Body2>
        </Popable>
        {review ? (
          <AvaText.Heading3>{trxDetails.slippageTol}%</AvaText.Heading3>
        ) : (
          <InputText
            onChangeText={text => trxDetails.setSlippageTol(Number(text))}
            text={`${trxDetails.slippageTol}`}
            mode={'percentage'}
            keyboardType={'numeric'}
            onInputRef={inputRef1 => {
              inputRef1.current?.setNativeProps({
                style: {
                  backgroundColor: theme.colorText1,
                  width: 66,
                  height: 40,
                  marginTop: -12,
                  fontFamily: 'Inter-SemiBold',
                  textAlign: 'center',
                  textAlignVertical: 'center',
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                  color: theme.colorBg2,
                  fontSize: 14,
                  lineHeight: 24
                }
              })
            }}
          />
        )}
      </Row>
      {review && (
        <>
          <Space y={16} />
          <Row
            style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Popable
              content={netFeeInfoMessage}
              position={'right'}
              style={{ minWidth: 200 }}
              backgroundColor={theme.colorBg3}>
              <AvaText.Body2>Network Fee ⓘ</AvaText.Body2>
            </Popable>
            <AvaText.Heading3>
              {trxDetails.networkFee + ' AVAX'}
            </AvaText.Heading3>
          </Row>
        </>
      )}
      {!review && (
        <>
          <Space y={16} />
          <NetworkFeeSelector
            networkFeeAvax={trxDetails.networkFee}
            networkFeeUsd={trxDetails.networkFeeUsd}
            gasPrice={gasPrice}
            onWeightedGas={price =>
              trxDetails.setGasPriceNanoAvax(Number.parseFloat(price.value))
            }
            onSettingsPressed={() => {
              const initGasLimit = trxDetails.gasLimit

              const onCustomGasLimit = (gasLimit: number) =>
                trxDetails.setGasLimit(gasLimit)

              navigate(AppNavigation.Swap.SwapTransactionFee, {
                gasLimit: initGasLimit.toString(),
                networkFee: trxDetails.networkFee,
                onSave: onCustomGasLimit
              })
            }}
          />
        </>
      )}
      <Space y={16} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Body2>Avalanche wallet fee</AvaText.Body2>
        <AvaText.Heading3>{trxDetails.avaxWalletFee}</AvaText.Heading3>
      </Row>
    </View>
  )
}

export default SwapTransactionDetail
