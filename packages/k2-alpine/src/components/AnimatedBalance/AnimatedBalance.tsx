import React, { useMemo } from 'react'
import { SxProp } from 'dripsy'
import Animated from 'react-native-reanimated'
import { TextVariant } from '../../theme/tokens/text'
import { Text, View } from '../Primitives'
import { AnimateFadeScale } from '../AnimatedFadeScale/AnimatedFadeScale'
import { SPRING_LINEAR_TRANSITION } from '../../utils'

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
  const animatedBalance = useMemo(() => {
    if (shouldMask) return

    return balance
      .toString()
      .split('')
      .map((character, index) => {
        return (
          <AnimateFadeScale key={`${character}-${index}`} delay={index * 30}>
            <Text variant={variant} sx={balanceSx}>
              {character}
            </Text>
          </AnimateFadeScale>
        )
      })
  }, [balance, balanceSx, shouldMask, variant])

  const animatedCurrency = useMemo(() => {
    if (currency === undefined || shouldMask) return
    return currency
      .toString()
      .split('')
      .map((character, index) => {
        return (
          <AnimateFadeScale
            key={`${character}-${index}`}
            delay={(balance.length + index) * 30}>
            <Text variant={variant} sx={currencySx}>
              {character}
            </Text>
          </AnimateFadeScale>
        )
      })
  }, [balance.length, currency, currencySx, shouldMask, variant])

  if (shouldMask && renderMaskView) {
    return renderMaskView()
  }

  return shouldAnimate === false ? (
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
      <Text variant={variant} sx={currencySx}>
        {currency}
      </Text>
    </View>
  ) : (
    <Animated.View
      testID="animated_balance"
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}>
      {animatedBalance}
      {animatedCurrency}
    </Animated.View>
  )
}
