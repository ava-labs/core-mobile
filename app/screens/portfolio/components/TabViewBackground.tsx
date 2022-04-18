import React, { useMemo } from 'react'
import { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View } from 'react-native'

const TabViewBackground = ({ style }: BottomSheetBackgroundProps) => {
  const theme = useApplicationContext().theme

  // styles
  const containerStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: theme.colorBg2
      }
    ],
    [style]
  )

  return (
    <View
      style={[
        containerStyle,
        { borderTopLeftRadius: 12, borderTopRightRadius: 12 }
      ]}
    />
  )
}

export default TabViewBackground
