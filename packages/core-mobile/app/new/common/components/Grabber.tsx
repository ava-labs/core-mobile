import React from 'react'
import { View } from 'react-native'

const Grabber = (): JSX.Element => (
  <View
    style={{
      height: 5,
      width: 50,
      borderRadius: 10,
      backgroundColor: 'lightgray',
      position: 'relative',
      top: -12
    }}
  />
)

export default Grabber
