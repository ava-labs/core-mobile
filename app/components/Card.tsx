import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity50 } from 'resources/Constants'

interface Props {
  style?: ViewStyle
}

const Card: FC<Props> = ({ style, children }) => {
  const { theme } = useApplicationContext()
  return (
    <View
      style={[
        { backgroundColor: theme.colorBg3 + Opacity50, borderRadius: 8 },
        style
      ]}>
      {children}
    </View>
  )
}

export default Card
