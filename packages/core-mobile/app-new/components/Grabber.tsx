import React from 'react'
import { View } from '@avalabs/k2-alpine'

const Grabber = (): JSX.Element => (
  <View
    sx={{
      height: 5,
      width: 50,
      borderRadius: 10,
      backgroundColor: 'red',
      position: 'relative',
      top: -12
    }}
  />
)

export default Grabber
