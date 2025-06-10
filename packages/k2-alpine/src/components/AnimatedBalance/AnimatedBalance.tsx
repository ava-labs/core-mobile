import { SxProp } from 'dripsy'
import React, { useCallback } from 'react'
import Animated from 'react-native-reanimated'
import { TextVariant } from '../../theme/tokens/text'
import { AnimateFadeScale } from '../AnimatedFadeScale/AnimatedFadeScale'
import { Text, View } from '../Primitives'

export const AnimatedBalance = ({
  variant = 'heading2',
  balance,
  currency,
  shouldMask = false,
  balanceSx,
  currencySx,
  shouldAnimate = true,
  renderMaskView
}: {
  balance: string
  currency?: string
  variant?: TextVariant
  shouldMask?: boolean
  balanceSx?: SxProp
  currencySx?: SxProp
  shouldAnimate?: boolean
  renderMaskView?: () => React.JSX.Element
}): JSX.Element => {
  const renderContent = useCallback(() => {
    const balanceChars = balance.toString().split('')
    const currencyChars = currency ? currency.toString().split('') : []

    return (
      <>
        {balanceChars.map((char, index) => (
          <AnimateFadeScale key={`balance-${index}`} delay={index * 30}>
            <Text variant={variant} sx={balanceSx}>
              {char}
            </Text>
          </AnimateFadeScale>
        ))}
        {currencyChars.map((char, index) => (
          <AnimateFadeScale
            key={`currency-${index}`}
            delay={(balanceChars.length + index) * 30}>
            <Text variant={variant} sx={currencySx}>
              {char}
            </Text>
          </AnimateFadeScale>
        ))}
      </>
    )
  }, [balance, currency, balanceSx, currencySx, variant])

  if (shouldMask && renderMaskView) {
    return renderMaskView()
  }

  if (shouldAnimate === false)
    return (
      <View
        testID="balance"
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 1
        }}>
        <Text variant={variant} sx={balanceSx} numberOfLines={1}>
          {balance}
        </Text>
        {currency && (
          <Text variant={variant} sx={currencySx}>
            {currency}
          </Text>
        )}
      </View>
    )

  return (
    <Animated.View
      testID="animated_balance"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}>
      {renderContent()}
    </Animated.View>
  )
}
