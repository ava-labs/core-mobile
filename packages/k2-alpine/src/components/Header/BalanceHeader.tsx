import React from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated'
import { Icons } from '../../theme/tokens/Icons'
import { colors } from '../../theme/tokens/colors'
import { AnimatedText } from '../Animated/AnimatedText'
import { PriceChangeIndicator } from '../PriceChangeIndicator/PriceChangeIndicator'
import { Text, View } from '../Primitives'
import { PriceChange } from '../PriceChangeIndicator/types'
import { BalanceLoader } from './BalanceHeaderLoader'

const fadeInTransition = FadeIn.delay(250)
const springTransition = LinearTransition.springify().damping(100)

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
  priceChange: PriceChange
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
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <AnimatedText characters={formattedBalance} />
          <Animated.View entering={fadeInTransition} layout={springTransition}>
            <Text
              style={[
                { fontFamily: 'Aeonik-Medium', fontSize: 18, lineHeight: 28 }
              ]}>
              {` ${currency}`}
            </Text>
          </Animated.View>
        </View>

        <View
          style={{
            alignSelf: 'flex-start'
          }}>
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
              animated={true}
            />
          )}
        </View>
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
