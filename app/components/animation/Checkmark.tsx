import React, { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import LottieView from 'lottie-react-native'

const animation = require('assets/lotties/checkmark.json')

interface Props {
  size: number
}

const Checkmark: FC<Props> = ({ size = 40 }) => {
  return (
    <View style={styles.container}>
      <LottieView
        autoPlay={true}
        loop={false}
        source={animation}
        style={{
          width: size,
          height: size
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default Checkmark
