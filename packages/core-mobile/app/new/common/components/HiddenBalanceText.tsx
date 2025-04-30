import { SxProp, Text } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'

export const HiddenBalanceText = ({
  variant = 'heading2',
  sx
}: {
  variant?: TextVariant
  sx?: SxProp
}): React.JSX.Element => {
  const { formatCurrency } = useFormatCurrency()
  const maskedText = formatCurrency({
    amount: 0
  })
    .replace('0.00', '')
    .trim()

  return (
    <Text variant={variant} sx={sx}>
      {maskedText + '••••••'}
    </Text>
  )
}
