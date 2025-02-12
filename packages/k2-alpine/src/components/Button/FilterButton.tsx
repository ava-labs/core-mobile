import React from 'react'
import { ViewStyle } from 'react-native'
import { Icons } from '../../theme/tokens/Icons'
import { useTheme } from '../../hooks'
import { Button, getTintColor } from './Button'

export const FilterButton = ({
  title,
  style,
  disabled,
  onPress
}: {
  title: string
  style?: ViewStyle
  disabled?: boolean
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const tintColor = getTintColor('secondary', theme, disabled)

  return (
    <Button
      style={style}
      size="small"
      type="secondary"
      onPress={onPress}
      rightIcon={
        <Icons.Custom.ArrowDown style={{ marginLeft: 5 }} color={tintColor} />
      }>
      {title}
    </Button>
  )
}
