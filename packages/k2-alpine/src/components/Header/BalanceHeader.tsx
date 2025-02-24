import React, { useEffect, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Text, View } from '../Primitives'
import { PriceChangeIndicator } from '../PriceChangeIndicator/PriceChangeIndicator'
import { Icons } from '../../theme/tokens/Icons'
import { colors } from '../../theme/tokens/colors'
import { BalanceLoader } from './BalanceHeaderLoader'
import { PriceChange } from '../PriceChange/PriceChange'
import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated'

export const BalanceHeader = ({
  accountName,
  formattedBalance,
  currency,
  errorMessage,
  priceChange,
  onLayout,
  isLoading
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
  isLoading?: boolean
}): React.JSX.Element => {
  const renderBalance = (): React.JSX.Element => {
    if (isLoading) {
      return <BalanceLoader />
    }
    return (
      <View
        style={{
          flexDirection: 'column',
          gap: 5
        }}>
        <Animated.View
          layout={LinearTransition.springify()}
          style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <PriceChange formattedPrice={formattedBalance} />
          <Text
            sx={{ fontFamily: 'Aeonik-Medium', fontSize: 18, lineHeight: 28 }}>
            {` ${currency}`}
          </Text>
        </Animated.View>

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
            formattedPrice={priceChange?.formattedPrice}
            status={priceChange.status}
            formattedPercent={priceChange.formattedPercent}
            textVariant="buttonMedium"
          />
        )}
      </View>
    )
  }
  return (
    <View onLayout={onLayout}>
      <Text
        variant="heading2"
        sx={{ color: '$textSecondary', lineHeight: 38 }}
        numberOfLines={1}>
        {accountName}
      </Text>
      {renderBalance()}
    </View>
  )
}
