import React, { useMemo } from 'react'
import { SxProp } from 'dripsy'
import Animated from 'react-native-reanimated'
import { TextVariant } from '../../theme/tokens/text'
import { Text } from '../Primitives'
import { AnimateFadeScale } from '../AnimatedFadeScale/AnimatedFadeScale'
import { SPRING_LINEAR_TRANSITION } from '../../utils'

export const AnimatedText = ({
  variant = 'heading2',
  characters,
  sx
}: {
  characters: string
  variant?: TextVariant
  sx?: SxProp
}): JSX.Element => {
  const content = useMemo(() => {
    return characters
      .toString()
      .split('')
      .map((character, index) => {
        return (
          <AnimateFadeScale key={`${character}-${index}`} delay={index * 30}>
            <Text variant={variant} sx={sx}>
              {character}
            </Text>
          </AnimateFadeScale>
        )
      })
  }, [characters, sx, variant])

  return (
    <Animated.View
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
      }}>
      {content}
    </Animated.View>
  )
}
