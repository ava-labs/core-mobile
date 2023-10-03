/* eslint-disable sonarjs/no-all-duplicated-branches */
import React, { FC, useMemo } from 'react'
import { Platform, Switch as RNSwitch, SwitchProps } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

const Switch: FC<SwitchProps> = ({ value, disabled, ...rest }) => {
  const theme = useApplicationContext().theme

  // waiting for UX to give the colors for Android.
  const thumbColorOn = useMemo(
    () => (Platform.OS === 'android' ? theme.white : theme.white),
    [theme.white]
  )
  const thumbColorOff = useMemo(
    () => (Platform.OS === 'android' ? theme.white : theme.white),
    [theme.white]
  )
  const trackColorOn = useMemo(
    () =>
      Platform.OS === 'android' ? theme.colorPrimary1 : theme.colorPrimary1,
    [theme.colorPrimary1]
  )
  const trackColorOff = useMemo(
    () => (Platform.OS === 'android' ? theme.colorBg2 : theme.colorBg2),
    [theme.colorBg2]
  )

  return (
    <RNSwitch
      {...rest}
      value={value}
      disabled={disabled}
      thumbColor={value ? thumbColorOn : thumbColorOff}
      trackColor={{ false: trackColorOff, true: trackColorOn }}
      ios_backgroundColor={trackColorOff}
    />
  )
}

export default Switch
