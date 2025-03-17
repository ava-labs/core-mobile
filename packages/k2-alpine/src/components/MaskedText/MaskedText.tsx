import React, { PropsWithChildren } from 'react'
import { SxProp } from 'dripsy'
import { TextProps } from 'react-native'
import { TextVariant } from '../../theme/tokens/text'
import { MaskedView } from '../MaskedView/MaskedView'
import { Text } from '../Primitives'
import { useTheme } from '../../hooks'

export const MaskedText = ({
  variant = 'body2',
  children,
  shouldMask = false,
  maskWidth = 50,
  maskBackgroundColor,
  sx,
  ...rest
}: {
  variant?: TextVariant
  shouldMask: boolean
  maskWidth?: number
  maskBackgroundColor?: string
  sx?: SxProp
} & PropsWithChildren &
  TextProps): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  if (shouldMask) {
    return (
      <MaskedView
        variant={variant}
        sx={{
          backgroundColor: maskBackgroundColor ?? colors.$borderPrimary,
          width: maskWidth,
          ...sx
        }}
      />
    )
  }

  return (
    <Text variant={variant} sx={sx} {...rest}>
      {children}
    </Text>
  )
}
