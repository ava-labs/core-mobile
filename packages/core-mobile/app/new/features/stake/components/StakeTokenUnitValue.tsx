import { TokenUnit } from '@avalabs/core-utils-sdk'
import { SxProp, Text, View } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useAvaxTokenPriceInSelectedCurrency } from 'hooks/useAvaxTokenPriceInSelectedCurrency'
import React from 'react'

export const StakeTokenUnitValue = ({
  value,
  isReward,
  textSx
}: {
  value?: TokenUnit
  isReward?: boolean
  textSx?: SxProp
}): JSX.Element => {
  const avaxPrice = useAvaxTokenPriceInSelectedCurrency()
  const { formatCurrency } = useFormatCurrency()
  const valueInCurrency = value?.mul(avaxPrice)
  const valueInCurrencyDisplay = valueInCurrency
    ? formatCurrency({ amount: valueInCurrency.toDisplay({ asNumber: true }) })
    : UNKNOWN_AMOUNT

  return (
    <View sx={{ marginVertical: 15, alignItems: 'flex-end' }}>
      <Text
        variant="body1"
        sx={{ color: isReward ? '$textSuccess' : '$textPrimary', ...textSx }}>
        {isReward ? '+' : ''}
        {value?.toDisplay() ?? UNKNOWN_AMOUNT} AVAX
      </Text>
      <Text variant="subtitle2" sx={textSx}>
        {valueInCurrencyDisplay}
      </Text>
    </View>
  )
}
