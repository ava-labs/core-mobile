import React, { FC, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import LottieView from 'lottie-react-native'

const animation = require('assets/lotties/checkmark.json')

interface Props {
  size: number
}

const Checkmark: FC<Props> = ({ size = 40 }) => {
  const lottieRef = React.useRef<LottieView | null>(null)

  // temp workaround for autoplay issue
  // https://github.com/lottie-react-native/lottie-react-native/issues/832
  useEffect(() => {
    setTimeout(() => {
      lottieRef.current?.play()
    }, 0)
  }, [])

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        autoPlay={false}
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
