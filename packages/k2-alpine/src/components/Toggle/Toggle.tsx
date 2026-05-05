import React, { FC } from 'react'
import { Switch, SwitchProps } from 'react-native'
import { alpha } from '../../utils'
import { useTheme } from '../../hooks'

export const Toggle: FC<SwitchProps> = ({
  value,
  disabled,
  testID,
  style,
  ...rest
}) => {
  const { theme } = useTheme()
  const { colors } = theme

  const opacity = disabled ? 0.4 : 1
  // Hello UI toggles are Whale blue ($primary) when on; default theme
  // keeps the legacy green (#3AC489) so non-Moto consumers don't change.
  const onColor = theme.variant === 'moto' ? colors.$primary : '#3AC489'

  return (
    <Switch
      {...rest}
      accessible={testID !== undefined}
      testID={testID}
      value={value}
      style={[style, { opacity, alignSelf: 'center' }]}
      disabled={disabled}
      thumbColor={'#FFFFFF'}
      trackColor={{
        false: alpha(colors.$textPrimary, 0.3),
        true: disabled ? alpha(colors.$textPrimary, 0.3) : onColor
      }}
      ios_backgroundColor={alpha(colors.$textPrimary, 0.3)}
    />
  )
}
