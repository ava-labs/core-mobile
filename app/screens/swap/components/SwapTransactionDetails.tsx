import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import InputText from 'components/InputText'
import { Popable } from 'react-native-popable'
import NetworkFeeSelector, { FeePreset } from 'components/NetworkFeeSelector'
import { Row } from 'components/Row'
import Big from 'big.js'
import { PopableContent } from 'components/PopableContent'
import { PopableLabel } from 'components/PopableLabel'
import { useSelector } from 'react-redux'
import { selectNetworkFee } from 'store/networkFee'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'

const isSlippageValid = (value: string) => {
  if (
    (parseFloat(value) >= 0 &&
      parseFloat(value) <= 100 &&
      value?.length <= 4) ||
    !value
  ) {
    return true
  }
  return false
}

interface SwapTransactionDetailProps {
  review?: boolean
  fromTokenSymbol?: string
  toTokenSymbol?: string
  rate: number
  walletFee?: number
  onGasChange?: (gasPrice: bigint, feeType: FeePreset) => void
  onGasLimitChange?: (gasLimit: number) => void
  gasLimit: number
  gasPrice: bigint
  slippage: number
  setSlippage?: (slippage: number) => void
  selectedGasFee?: FeePreset
  maxGasPrice?: string
}

const slippageInfoMessage = (
  <PopableContent message="Suggested slippage – your transaction will fail if the price changes unfavorably more than this percentage" />
)

const SwapTransactionDetail: FC<SwapTransactionDetailProps> = ({
  review = false,
  fromTokenSymbol,
  toTokenSymbol,
  rate,
  walletFee,
  onGasChange,
  onGasLimitChange,
  gasLimit,
  gasPrice,
  slippage,
  setSlippage
}) => {
  const { theme } = useApplicationContext()
  const networkFee = useSelector(selectNetworkFee)

  const netFeeInfoMessage = (
    <PopableContent
      message={`Gas limit: ${gasLimit} \nGas price: ${bigintToBig(
        gasPrice,
        networkFee.displayDecimals
      ).toFixed(0)} nAVAX`}
    />
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
        <AvaText.Body2 color={theme.white}>Rate</AvaText.Body2>
        <AvaText.Heading3>
          1 {fromTokenSymbol} ≈ {rate?.toFixed(4)} {toTokenSymbol}
        </AvaText.Heading3>
      </Row>
      <Space y={16} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Popable
          content={slippageInfoMessage}
          position={'top'}
          strictPosition={true}
          style={{ minWidth: 300, marginBottom: review ? 0 : -32 }}
          backgroundColor={theme.neutral100}>
          <PopableLabel
            label="Slippage tolerance"
            textStyle={{ color: theme.white }}
          />
        </Popable>
        {review ? (
          <AvaText.Heading3>{slippage}%</AvaText.Heading3>
        ) : (
          <InputText
            onChangeText={value => {
              const sanitizedValue = value.startsWith('.') ? '0.' : value
              isSlippageValid(sanitizedValue) &&
                setSlippage?.(Number(sanitizedValue))
            }}
            text={slippage.toString()}
            mode={'percentage'}
            keyboardType={'numeric'}
            minHeight={32}
            paddingVertical={0}
            {...{ maxLength: 2, fontSize: 14, lineHeight: 14 }}
            style={{
              backgroundColor: theme.colorBg3,
              borderRadius: 8
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
              strictPosition={true}
              style={{ minWidth: 180 }}
              backgroundColor={theme.neutral100}>
              <PopableLabel
                label="Network Fee"
                textStyle={{ color: theme.white }}
              />
            </Popable>
            <AvaText.Heading3>
              {new Big(gasPrice.toString())
                .mul(gasLimit)
                .div(10 ** 18)
                .toFixed(6)}{' '}
              AVAX
            </AvaText.Heading3>
          </Row>
        </>
      )}
      {!review && (
        <>
          <Space y={16} />
          <NetworkFeeSelector
            gasLimit={gasLimit}
            onGasPriceChange={onGasChange}
            onGasLimitChange={onGasLimitChange}
          />
        </>
      )}
      <Space y={16} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Body2 color={theme.white}>Avalanche Wallet fee</AvaText.Body2>
        <AvaText.Heading3>{walletFee}</AvaText.Heading3>
      </Row>
    </View>
  )
}

export default SwapTransactionDetail
