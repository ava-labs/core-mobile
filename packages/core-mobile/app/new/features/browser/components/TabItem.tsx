import {
  alpha,
  ANIMATED,
  AnimatedPressable,
  Icons,
  Pressable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { useFocusEffect } from 'expo-router'
import React, { useEffect, useState, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'

const ROTATION = 2

export const TabItem = ({
  title,
  imagePath,
  index,
  style,
  onVerifyImagePath,
  onPress,
  onClose
}: {
  index: number
  title?: string
  imagePath: string
  style?: ViewStyle
  onVerifyImagePath: (imagePath: string) => Promise<boolean>
  onPress: () => void
  onClose: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  const rotation = useSharedValue(0)

  const rotationValue = useMemo(() => {
    const rowIndex = Math.floor(index / 2)
    const isEvenRow = rowIndex % 2 === 0
    const baseRotation = isEvenRow
      ? index % 2 === 0
        ? -ROTATION
        : ROTATION
      : index % 2 === 0
      ? ROTATION
      : -ROTATION

    if (!isEvenRow && index % 2 === 0) {
      return baseRotation + (rowIndex % 2 === 0 ? 1 : -1)
    }
    if (isEvenRow && index % 2 !== 0) {
      return baseRotation - (rowIndex % 2 === 0 ? 1 : -1)
    }

    return baseRotation
  }, [index])
  const [verifiedImageSource, setVerifiedImageSource] = useState<string>()
  useEffect(() => {
    onVerifyImagePath(imagePath)
      .then(isVerified => {
        if (isVerified) {
          setVerifiedImageSource(imagePath)
        }
      })
      .catch(() => {
        // do nothing
      })
  }, [imagePath, onVerifyImagePath])

  useFocusEffect(() => {
    setTimeout(() => {
      rotation.value = withSpring(rotationValue, ANIMATED.SPRING_CONFIG)
    }, index * 50)

    return () => {
      rotation.value = withTiming(0, ANIMATED.TIMING_CONFIG)
    }
  })

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotation.value}deg`
        }
      ]
    }
  })

  return (
    <AnimatedPressable onPress={onPress} style={style}>
      <Animated.View
        style={[
          cardStyle,
          {
            flex: 1
          }
        ]}>
        <View
          style={{
            flex: 1,
            borderRadius: 18,
            boxShadow: [
              {
                offsetX: 0,
                offsetY: 5,
                blurRadius: 15,
                spreadDistance: 0,
                color: alpha(theme.colors.$black, 0.15),
                inset: false
              }
            ]
          }}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.$surfacePrimary,
              borderRadius: 18,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.colors.$borderPrimary
            }}>
            <Image
              source={{ uri: verifiedImageSource }}
              renderToHardwareTextureAndroid={false}
              style={{ height: '100%' }}
            />

            <BlurView
              intensity={50}
              tint={theme.isDark ? 'dark' : 'light'}
              experimentalBlurMethod="dimezisBlurView"
              renderToHardwareTextureAndroid={false}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: alpha(
                  theme.isDark ? '#666666' : '#E6E6EA',
                  0.6
                ),
                height: 36,
                paddingLeft: 12,
                paddingRight: 8
              }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 15,
                  flex: 1,
                  color: theme.colors.$textPrimary
                }}>
                {title}
              </Text>
              <Pressable hitSlop={10} onPress={onClose}>
                <Icons.Content.Close
                  color={theme.colors.$textPrimary}
                  height={24}
                  width={24}
                />
              </Pressable>
            </BlurView>
          </View>
        </View>
      </Animated.View>
    </AnimatedPressable>
  )
}
