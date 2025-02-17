import React, { FC } from 'react'
import { Switch, SwitchProps } from 'react-native'
import { alpha } from '../../utils'
import { useTheme } from '../../hooks'

export const Toggle: FC<SwitchProps> = ({ value, disabled, ...rest }) => {
  const {
    theme: { colors }
  } = useTheme()

  const opacity = disabled ? 0.4 : 1

  return (
    <Switch
      {...rest}
      value={value}
      style={{ opacity }}
      disabled={disabled}
      thumbColor={'#FFFFFF'}
      trackColor={{
        false: alpha(colors.$textPrimary, 0.3),
        true: disabled ? alpha(colors.$textPrimary, 0.3) : '#3AC489'
      }}
      ios_backgroundColor={alpha(colors.$textPrimary, 0.3)}
    />
  )
}
