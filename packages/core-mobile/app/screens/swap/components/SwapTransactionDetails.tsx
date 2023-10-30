import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import InputText from 'components/InputText'
import NetworkFeeSelector, { FeePreset } from 'components/NetworkFeeSelector'
import { Row } from 'components/Row'
import Big from 'big.js'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { Tooltip } from 'components/Tooltip'

const isSlippageValid = (value: string): boolean => {
  return Boolean(
    (parseFloat(value) >= 0 &&
      parseFloat(value) <= 100 &&
      value?.length <= 4) ||
      !value
  )
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

const slippageInfoMessage =
  'Suggested slippage – your transaction will fail if the price changes unfavorably more than this percentage'

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
}): JSX.Element => {
  const { theme } = useApplicationContext()
  const { data: networkFee } = useNetworkFee()

  const netFeeInfoMessage = `Gas limit: ${gasLimit} \nGas price: ${bigintToBig(
    gasPrice,
    networkFee.displayDecimals
  ).toFixed(0)} nAVAX`

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
        <Tooltip
          content={slippageInfoMessage}
          style={{ width: 200 }}
          position="right"
          textStyle={{ color: theme.white }}>
          Slippage tolerance
        </Tooltip>
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
            <Tooltip
              content={netFeeInfoMessage}
              position={'right'}
              style={{ width: 180 }}
              textStyle={{ color: theme.white }}>
              Network Fee
            </Tooltip>
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
