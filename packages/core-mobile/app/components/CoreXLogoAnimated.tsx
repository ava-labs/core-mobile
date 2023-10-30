import React, { FC } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import LottieView from 'lottie-react-native'
import isString from 'lodash.isstring'
import OwlAnimation from '../assets/lotties/owl_short.json'

const { width } = Dimensions.get('window')
const sizes = {
  small: 40,
  large: width / 3
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})

interface Props {
  size?: number | 'small' | 'large'
  finalState?: boolean
}

const CoreXLogoAnimated: FC<Props> = ({ size = 50, finalState }) => {
  let customSize = size
  if (isString(size)) {
    customSize = sizes[size]
  }

  return (
    <View style={styles.container}>
      <View>
        <LottieView
          autoPlay={!finalState}
          progress={finalState ? 1 : 0}
          loop={false}
          source={OwlAnimation}
          style={{
            width: customSize,
            height: customSize
          }}
        />
      </View>
    </View>
  )
}

export default CoreXLogoAnimated
