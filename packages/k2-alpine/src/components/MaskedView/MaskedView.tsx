import React from 'react'
import { SxProp } from 'dripsy'
import { View, Text } from '../Primitives'
import { AnimateFadeScale } from '../AnimatedFadeScale/AnimatedFadeScale'
import { TextVariant } from '../../theme/tokens/text'

export const MaskedView = ({
  variant,
  sx,
  testID
}: {
  variant?: TextVariant
  sx?: SxProp
  testID?: string
}): React.JSX.Element => {
  return (
    <AnimateFadeScale delay={200}>
      <View sx={{ ...sx, borderRadius: 12 }}>
        <Text testID={testID} variant={variant} sx={{ color: 'transparent' }} />
      </View>
    </AnimateFadeScale>
  )
}
