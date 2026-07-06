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
          // Key by position, not `${character}-${index}`: keying by the glyph
          // remounted the node every time a digit changed, restarting the
          // fade-in from opacity 0 on each value update. Keying by index lets
          // characters update in place, so only genuinely new positions animate
          // in (CP-14631).
          <AnimateFadeScale key={index} delay={index * 30}>
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
