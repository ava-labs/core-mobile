import React, { PropsWithChildren } from 'react'
import { SxProp } from 'dripsy'
import { TextProps } from 'react-native'
import { TextVariant } from '../../theme/tokens/text'
import { AnimateFadeScale } from '../AnimatedFadeScale/AnimatedFadeScale'
import { PrivacyMask } from '../PrivacyMask/PrivacyMask'
import { getLineHeight } from '../../utils/getLineHeight'
import { Text } from '../Primitives'

export const PrivacyAwareText = ({
  variant = 'body2',
  children,
  isPrivacyModeEnabled = false,
  privacyMaskWidth = 50,
  sx,
  ...rest
}: {
  variant?: TextVariant
  isPrivacyModeEnabled: boolean
  privacyMaskWidth?: number
  sx?: SxProp
} & PropsWithChildren &
  TextProps): React.JSX.Element => {
  if (isPrivacyModeEnabled) {
    const privacyMaskHeight = getLineHeight(variant, sx)
    return (
      <AnimateFadeScale delay={200}>
        <PrivacyMask width={privacyMaskWidth} height={privacyMaskHeight} />
      </AnimateFadeScale>
    )
  }

  return (
    <Text variant={variant} sx={sx} {...rest}>
      {children}
    </Text>
  )
}
