import { SxProp, Text, TextVariant } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React, { useMemo } from 'react'

export const HiddenBalanceText = ({
  variant = 'heading2',
  isCurrency = true,
  sx
}: {
  variant?: TextVariant
  isCurrency?: boolean
  sx?: SxProp
}): React.JSX.Element => {
  const { formatCurrency } = useFormatCurrency()
  const maskedText = useMemo(() => {
    const dots = dot.repeat(6)

    if (isCurrency) {
      return formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, dots)
    }

    return dots
  }, [formatCurrency, isCurrency])

  return (
    <Text>
      {Array.from(maskedText).map((char, i) => (
        <Text
          key={i}
          variant={variant}
          sx={{
            ...(char === dot ? { fontFamily: 'DejaVuSansMono' } : {}),
            ...sx
          }}>
          {char}
        </Text>
      ))}
    </Text>
  )
}

const dot = '•'
