import React, { FC } from 'react'
import { View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import InputText from 'components/InputText'
import { Row } from 'components/Row'
import { Tooltip } from 'components/Tooltip'
import { useTheme } from '@avalabs/k2-mobile'

const isSlippageValid = (value: string): boolean => {
  return Boolean(
    (parseFloat(value) >= 0 &&
      parseFloat(value) <= 100 &&
      value?.length <= 4) ||
      !value
  )
}

interface SwapTransactionDetailProps {
  fromTokenSymbol?: string
  toTokenSymbol?: string
  rate: number
  slippage: number
  setSlippage?: (slippage: number) => void
}

const slippageInfoMessage =
  'Suggested slippage – your transaction will fail if the price changes unfavorably more than this percentage'

const SwapTransactionDetail: FC<SwapTransactionDetailProps> = ({
  fromTokenSymbol,
  toTokenSymbol,
  rate,
  slippage,
  setSlippage
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <>
        <Space y={16} />
        <AvaText.Heading3>Transaction details</AvaText.Heading3>
        <Space y={16} />
      </>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Body2 color={theme.colors.$white}>Rate</AvaText.Body2>
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
          textStyle={{ color: theme.colors.$white }}>
          Slippage tolerance
        </Tooltip>

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
            backgroundColor: theme.colors.$neutral800,
            borderRadius: 8
          }}
        />
      </Row>
    </View>
  )
}

export default SwapTransactionDetail
