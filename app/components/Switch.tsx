import React, { FC } from 'react'
import { Switch as RNSwitch, SwitchProps } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

const Switch: FC<SwitchProps> = ({ value, disabled, ...rest }) => {
  const theme = useApplicationContext().theme

  return (
    <RNSwitch
      {...rest}
      value={value}
      disabled={disabled}
      thumbColor={theme.white}
      trackColor={{ false: theme.colorBg2, true: theme.colorPrimary1 }}
      ios_backgroundColor={theme.colorBg2}
    />
  )
}

export default Switch
