import React, { useMemo } from 'react'
import { SxProp } from 'dripsy'
import Animated from 'react-native-reanimated'
import { TextVariant } from '../../theme/tokens/text'
import { Text } from '../Primitives'
import { AnimateFadeScale } from '../AnimatedFadeScale/AnimatedFadeScale'
import { SPRING_LINEAR_TRANSITION } from '../../utils'
import { MaskedText } from '../MaskedText/MaskedText'

export const AnimatedBalance = ({
  variant = 'heading2',
  balance,
  currency,
  shouldMask = false,
  maskWidth = 60,
  balanceSx,
  currencySx,
  maskbackgroundColor
}: {
  balance: string
  currency?: string
  variant?: TextVariant
  shouldMask?: boolean
  maskWidth?: number
  balanceSx?: SxProp
  currencySx?: SxProp
  maskbackgroundColor?: string
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

  if (shouldMask) {
    return (
      <MaskedText
        sx={balanceSx}
        variant={variant}
        shouldMask={shouldMask}
        maskWidth={maskWidth}
        numberOfLines={1}
        maskbackgroundColor={maskbackgroundColor}
      />
    )
  }

  return (
    <Animated.View
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
