import React, { FC } from 'react'
import { Switch as RNSwitch, SwitchProps, useColorScheme } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

const Switch: FC<SwitchProps> = ({ value, disabled, ...rest }) => {
  const theme = useApplicationContext().theme
  const colorScheme = useColorScheme()
  return (
    <RNSwitch
      {...rest}
      value={value}
      disabled={disabled}
      thumbColor={theme.white}
      trackColor={{
        false: theme.colorBg2,
        true: theme.colorPrimary1
      }}
      ios_backgroundColor={
        colorScheme === 'dark' ? theme.colorBg1 : theme.colorBg2
      }
    />
  )
}

export default Switch
