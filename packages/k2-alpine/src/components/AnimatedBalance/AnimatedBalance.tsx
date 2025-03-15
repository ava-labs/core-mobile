import React, { useMemo } from 'react'
import { SxProp } from 'dripsy'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { TextVariant } from '../../theme/tokens/text'
import { Text } from '../Primitives'
import { PrivacyMask } from '../PrivacyMask/PrivacyMask'
import { AnimateFadeScale } from '../AnimatedFadeScale/AnimatedFadeScale'
import { getLineHeight } from '../../utils/getLineHeight'

const springTransition = LinearTransition.springify()

export const AnimatedBalance = ({
  variant = 'heading2',
  balance,
  currency,
  isPrivacyModeEnabled = false,
  privacyMaskWidth = 60,
  privacyMaskbackgroundColor,
  balanceSx,
  currencySx
}: {
  balance: string
  currency?: string
  variant?: TextVariant
  isPrivacyModeEnabled?: boolean
  privacyMaskWidth?: number
  privacyMaskbackgroundColor?: string
  balanceSx?: SxProp
  currencySx?: SxProp
}): JSX.Element => {
  const animatedBalance = useMemo(() => {
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
  }, [balance, balanceSx, variant])

  const animatedCurrency = useMemo(() => {
    if (currency === undefined) return
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
  }, [balance.length, currency, currencySx, variant])

  if (isPrivacyModeEnabled) {
    const privacyMaskHeight = getLineHeight(variant, balanceSx)

    return (
      <AnimateFadeScale delay={200}>
        <PrivacyMask
          width={privacyMaskWidth}
          height={privacyMaskHeight}
          backgroundColor={privacyMaskbackgroundColor}
        />
      </AnimateFadeScale>
    )
  }

  return (
    <Animated.View
      layout={springTransition}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}>
      {animatedBalance}
      {animatedCurrency}
    </Animated.View>
  )
}
