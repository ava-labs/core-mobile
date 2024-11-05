import React, { useRef } from 'react'
import {
  View,
  PanResponder,
  Animated,
  StyleSheet,
  Dimensions
} from 'react-native'
import { Icons, useTheme } from '@avalabs/k2-mobile'

const { width } = Dimensions.get('window')
const _sliderWidth = 64
const _sliderHeight = 64

const SlideToConfirm = ({
  text,
  onConfirm
}: {
  text: string
  onConfirm: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const slideWidth = width - 40 // Space for the slider to move
  const unlockThreshold = slideWidth - _sliderWidth // Set unlock point near the end
  const sliderWidth = useRef(new Animated.Value(_sliderWidth)).current

  const textColorAnim = sliderWidth.interpolate({
    inputRange: [0, unlockThreshold],
    outputRange: ['#FFFFFF', '#000000'],
    extrapolate: 'clamp'
  })
  const iconOpacityAnim = sliderWidth.interpolate({
    inputRange: [_sliderWidth, unlockThreshold / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  })

  // PanResponder for gesture handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      // Limit the slider to the width of the container
      if (gestureState.dx >= 0 && gestureState.dx <= unlockThreshold) {
        sliderWidth.setValue(_sliderWidth + gestureState.dx)
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > unlockThreshold) {
        onConfirm()
        Animated.spring(sliderWidth, {
          toValue: slideWidth,
          useNativeDriver: false
        }).start()
      } else {
        // Reset if not unlocked
        Animated.spring(sliderWidth, {
          toValue: _sliderWidth,
          useNativeDriver: false
        }).start()
      }
    }
  })

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.slider, { width: sliderWidth }]}>
          <Animated.View testID="slide" style={{ opacity: iconOpacityAnim }}>
            <Icons.Navigation.ArrowForwardIOS color={colors.$neutral900} />
          </Animated.View>
        </Animated.View>
        <Animated.Text
          style={[styles.instructionText, { color: textColorAnim }]}>
          {text}
        </Animated.Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  instructionText: {
    fontSize: 20,
    color: '#ffffff',
    alignSelf: 'center'
  },
  sliderContainer: {
    width: width - 40, // Full width
    height: _sliderHeight,
    borderRadius: 32,
    backgroundColor: '#A1A1AA40',
    justifyContent: 'center',
    position: 'relative'
  },
  slider: {
    height: _sliderHeight,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0
  }
})

export default SlideToConfirm
