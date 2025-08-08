import React, { useRef } from 'react'
import { PanResponder, Animated, Dimensions } from 'react-native'
import { useTheme, View, Icons } from '@avalabs/k2-alpine'

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
  const { theme } = useTheme()
  const slideWidth = width - 40 // Space for the slider to move
  const unlockThreshold = slideWidth - _sliderWidth // Set unlock point near the end
  const sliderWidth = useRef(new Animated.Value(_sliderWidth)).current

  const textColorAnim = sliderWidth.interpolate({
    inputRange: [0, unlockThreshold],
    outputRange: [theme.colors.$textPrimary, theme.colors.$surfacePrimary],
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
    <View
      sx={{
        alignItems: 'center'
      }}>
      <View
        sx={{
          width: width - 40, // Full width
          height: _sliderHeight,
          borderRadius: 32,
          backgroundColor: '#A1A1AA40',
          justifyContent: 'center',
          position: 'relative'
        }}>
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            height: _sliderHeight,
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            left: 0,
            width: sliderWidth,
            backgroundColor: theme.colors.$textPrimary
          }}>
          <Animated.View testID="slide" style={{ opacity: iconOpacityAnim }}>
            <Icons.Navigation.ArrowForwardIOS
              color={theme.colors.$surfacePrimary}
            />
          </Animated.View>
        </Animated.View>
        <Animated.Text
          allowFontScaling={false}
          style={[
            {
              fontSize: 15,
              fontWeight: '600',
              color: textColorAnim,
              alignSelf: 'center'
            }
          ]}>
          {text}
        </Animated.Text>
      </View>
    </View>
  )
}

export default SlideToConfirm
