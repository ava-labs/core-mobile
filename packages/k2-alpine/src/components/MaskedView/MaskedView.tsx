import React from 'react'
import { SxProp } from 'dripsy'
import { View, Text } from '../Primitives'
import { AnimateFadeScale } from '../AnimatedFadeScale/AnimatedFadeScale'
import { TextVariant } from '../../theme/tokens/text'

export const MaskedView = ({
  variant,
  sx
}: {
  variant?: TextVariant
  sx?: SxProp
}): React.JSX.Element => {
  return (
    <AnimateFadeScale delay={200}>
      <View sx={{ ...sx, borderRadius: 12 }}>
        <Text variant={variant} sx={{ color: 'transparent' }} />
      </View>
    </AnimateFadeScale>
  )
}
