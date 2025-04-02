import React from 'react'
import { View } from 'react-native'

const Grabber = (): JSX.Element => (
  <View
    testID="grabber"
    style={{
      height: 5,
      width: 50,
      borderRadius: 10,
      backgroundColor: 'lightgray',
      position: 'absolute',
      alignSelf: 'center',
      top: 9
    }}
  />
)

export default Grabber
