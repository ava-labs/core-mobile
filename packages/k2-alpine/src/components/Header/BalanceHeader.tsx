import React from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Text, View } from '../Primitives'
import { PriceChangeIndicator } from '../PriceChangeIndicator/PriceChangeIndicator'
import { Icons } from '../../theme/tokens/Icons'
import { colors } from '../../theme/tokens/colors'

export const BalanceHeader = ({
  accountName,
  formattedBalance,
  currency,
  errorMessage,
  priceChange,
  onLayout
}: {
  accountName: string
  formattedBalance: string
  currency: string
  errorMessage?: string
  priceChange: {
    formattedPrice: string
    status: 'up' | 'down' | 'equal'
    formattedPercent?: string
  }
  onLayout?: (event: LayoutChangeEvent) => void
}): JSX.Element => {
  return (
    <View sx={{ gap: 5 }} onLayout={onLayout}>
      <View>
        <Text
          variant="heading2"
          sx={{ color: '$textSecondary', lineHeight: 38, marginRight: 100 }}
          numberOfLines={1}>
          {accountName}
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text variant="heading2" sx={{ lineHeight: 38 }}>
            {formattedBalance}
          </Text>
          <Text
            sx={{ fontFamily: 'Aeonik-Medium', fontSize: 18, lineHeight: 28 }}>
            {currency}
          </Text>
        </View>
      </View>
      {errorMessage ? (
        <View sx={{ gap: 4, alignItems: 'center', flexDirection: 'row' }}>
          <Icons.Alert.Error
            width={16}
            height={16}
            color={colors.$accentDanger}
          />
          <Text variant="buttonMedium" sx={{ color: colors.$accentDanger }}>
            {errorMessage}
          </Text>
        </View>
      ) : (
        <PriceChangeIndicator
          formattedPrice={priceChange.formattedPrice}
          status={priceChange.status}
          formattedPercent={priceChange.formattedPercent}
          textVariant="buttonMedium"
        />
      )}
    </View>
  )
}
