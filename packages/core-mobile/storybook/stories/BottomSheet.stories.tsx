import React, { useState } from 'react'
import { View } from 'react-native'
import { BottomSheet } from 'components/BottomSheet'
import AvaButton from 'components/AvaButton'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'BottomSheet',
  decorators: [withCenterView]
}

export const Basic = (): React.JSX.Element => {
  const [toggle, setToggle] = useState(false)
  return (
    <>
      <View
        style={{
          width: '100%',
          paddingHorizontal: 16
        }}>
        <AvaButton.PrimaryLarge onPress={() => setToggle(prev => !prev)}>
          Toggle
        </AvaButton.PrimaryLarge>
      </View>
      {toggle && (
        <BottomSheet onClose={() => setToggle(false)}>
          <View
            style={{
              flex: 1,
              margin: 100,
              borderRadius: 25,
              backgroundColor: 'green'
            }}
          />
        </BottomSheet>
      )}
    </>
  )
}
