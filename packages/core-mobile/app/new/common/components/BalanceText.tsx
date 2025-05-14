import { SxProp, Text, TextVariant } from '@avalabs/k2-alpine'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { TextProps } from 'react-native'
import { HiddenBalanceText } from './HiddenBalanceText'

export const BalanceText = ({
  variant,
  sx,
  isCurrency = true,
  ...rest
}: {
  variant: TextVariant
  sx?: SxProp
  isCurrency?: boolean
} & TextProps): JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  return isPrivacyModeEnabled ? (
    <HiddenBalanceText variant={variant} sx={sx} isCurrency={isCurrency} />
  ) : (
    <Text variant={variant} sx={sx} {...rest} />
  )
}
