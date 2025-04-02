import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import InputText from 'components/InputText'
import { Row } from 'components/Row'
import { Tooltip } from 'components/Tooltip'
import { useTheme } from '@avalabs/k2-mobile'
import { basisPointsToPercentage } from 'utils/basisPointsToPercentage'
import { PARASWAP_PARTNER_FEE_BPS } from 'contexts/SwapContext/consts'
import { useSelector } from 'react-redux'
import { selectIsSwapFeesBlocked } from 'store/posthog'

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
  const isSwapFeesBlocked = useSelector(selectIsSwapFeesBlocked)

  const tooltipCoreFeeMessageContent = useMemo(
    () =>
      `Core always finds the best price from the top liquidity providers. A fee of ${basisPointsToPercentage(
        PARASWAP_PARTNER_FEE_BPS
      )} is automatically factored into the quote.`,
    []
  )

  const tooltipCoreFeeMessage = useMemo(
    () =>
      `Quote includes a ${basisPointsToPercentage(
        PARASWAP_PARTNER_FEE_BPS
      )} Core fee`,
    []
  )

  const renderSwapFeesDisclaimer = useCallback(() => {
    if (isSwapFeesBlocked) return null

    return (
      <>
        <Space y={8} />
        <Tooltip
          content={tooltipCoreFeeMessageContent}
          style={{ width: 200 }}
          position="top"
          textStyle={{ color: theme.colors.$neutral400 }}>
          {tooltipCoreFeeMessage}
        </Tooltip>
      </>
    )
  }, [
    isSwapFeesBlocked,
    theme.colors.$neutral400,
    tooltipCoreFeeMessageContent,
    tooltipCoreFeeMessage
  ])

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
      {renderSwapFeesDisclaimer()}
    </View>
  )
}

export default SwapTransactionDetail
