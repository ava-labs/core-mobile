import React, { useRef, useState, useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg'
import { withTiming } from 'react-native-reanimated'
import { Easing, Animated as RNAnimated } from 'react-native'

const AnimatedView = Animated.View

export const AvaxLogoGradientSvg = ({
  isDark
}: {
  isDark: boolean
}): React.JSX.Element => {
  const rotateValue = useRef(new RNAnimated.Value(0)).current
  const [gradientTransform, setGradientTransform] = useState('rotate(0)')
  const opacity = useSharedValue(1)

  const gradientColor1 = isDark ? '#78787C' : '#EBEBEC'
  const gradientColor2 = isDark ? '#47474C' : '#B8B8BA'
  const fill = isDark
    ? 'url(#paint0_linear_10493_40497)'
    : 'url(#paint0_linear_10493_40496)'

  useEffect(() => {
    const animation = RNAnimated.loop(
      RNAnimated.timing(rotateValue, {
        toValue: 360,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false // must be false, because we are animating a non-native property
      })
    )
    animation.start()

    // Listen to animation updates and update the gradientTransform string
    const id = rotateValue.addListener(({ value }) => {
      setGradientTransform(`rotate(${value})`)
    })

    return () => {
      animation.stop()
      rotateValue.removeListener(id)
    }
  }, [rotateValue])

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 3000 }), -1, true)
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }))

  return (
    <AnimatedView style={[{ width: 319, height: 281 }, animatedStyle]}>
      <Svg width={319} height={281} viewBox="0 0 319 281" fill="none">
        <Defs>
          <LinearGradient
            id={fill}
            x1="159.504"
            y1="0"
            x2="159.504"
            y2="280.391"
            gradientUnits="userSpaceOnUse"
            gradientTransform={gradientTransform}>
            <Stop offset="0" stopColor={gradientColor1} />
            <Stop offset="1" stopColor={gradientColor2} />
          </LinearGradient>
        </Defs>
        <Path
          d="M146.06 7.76174C152.033 -2.58725 166.971 -2.58725 172.944 7.76174H172.943L215.937 82.2237C221.182 91.3082 221.264 102.473 216.183 111.622L215.937 112.057L127.361 265.475C122.116 274.559 112.491 280.212 102.025 280.387L101.525 280.391H15.5421C3.59403 280.39 -3.87081 267.454 2.10265 257.108L146.06 7.76174ZM238.851 167.499C245.003 157.634 259.566 157.793 265.446 167.977L316.905 257.107L317.176 257.594C322.558 267.691 315.46 279.993 304.023 280.381L303.466 280.391H200.548C188.597 280.391 181.132 267.453 187.106 257.107L238.565 167.977L238.851 167.499ZM167.747 10.7617C164.083 4.41339 154.921 4.41339 151.257 10.7617H151.256L7.29796 260.108C3.63352 266.455 8.2143 274.39 15.5421 274.391H101.525L102.321 274.377C110.529 274.104 118.043 269.617 122.166 262.475L210.741 109.057L211.127 108.36C214.993 101.118 214.865 92.3657 210.741 85.2237L167.748 10.7617H167.747ZM260.251 170.977C256.644 164.73 247.709 164.632 243.936 170.684L243.76 170.977L192.301 260.107C188.637 266.454 193.217 274.391 200.548 274.391H303.466L303.808 274.385C310.822 274.146 315.177 266.6 311.875 260.406L311.71 260.107L260.251 170.977Z"
          fill={`url(#${fill})`}
        />
      </Svg>
    </AnimatedView>
  )
}
