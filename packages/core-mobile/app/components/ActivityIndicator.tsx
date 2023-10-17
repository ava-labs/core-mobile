import React from 'react'
import {
  ActivityIndicator as RNActivityIndicator,
  ViewStyle,
  StyleProp
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

type Props = {
  style?: StyleProp<ViewStyle>
  size?: number | 'small' | 'large' | undefined
}

export const ActivityIndicator: React.FC<Props> = ({
  style,
  size = 'small'
}) => {
  const { theme } = useApplicationContext()

  return (
    <RNActivityIndicator
      style={style}
      color={theme.colorPrimary1}
      size={size}
    />
  )
}
