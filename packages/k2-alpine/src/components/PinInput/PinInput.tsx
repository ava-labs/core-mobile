import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { Platform, TextInput, Vibration, ViewStyle } from 'react-native'
import Animated, {
  cancelAnimation,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { TouchableOpacity } from '../Primitives'
import { useTheme } from '../..'

export const PinInput = forwardRef<PinInputActions, PinInputProps>(
  ({ value, onChangePin, length = 6, style }, ref) => {
    const textInputRef = useRef<TextInput>(null)
    const wrongPinAnimation = useSharedValue(0)
    const loadingDotAnimations = useLoadingDotAnimations(length)
    const isLoading = useSharedValue(false)

    const startLoadingAnimation = (): void => {
      const triggerAnimations = async (): Promise<void> => {
        const animationPromises = loadingDotAnimations.map(
          (sharedValue, index) =>
            new Promise<void>(resolve => {
              sharedValue.value = withSequence(
                withDelay(index * 50, withTiming(-15, { duration: 200 })),
                withTiming(0, { duration: 200 })
              )

              setTimeout(() => {
                runOnJS(resolve)()
              }, index * 50 + 400)
            })
        )

        return Promise.all(animationPromises).then(() => {
          if (isLoading.value) {
            runOnJS(triggerAnimations)()
          }
        })
      }

      isLoading.value = true
      runOnJS(triggerAnimations)()
    }

    const stopLoadingAnimation = (onComplete: () => void): void => {
      isLoading.value = false
      loadingDotAnimations.forEach(animation => {
        cancelAnimation(animation)
        animation.value = 0
      })

      runOnJS(onComplete)()
    }

    const fireWrongPinAnimation = (onComplete: () => void): void => {
      wrongPinAnimation.value = withSequence(
        withTiming(12, { duration: 80 }),
        withTiming(-12, { duration: 80 }),
        withTiming(8, { duration: 70 }),
        withTiming(-8, { duration: 70 }),
        withTiming(4, { duration: 60 }),
        withTiming(-4, { duration: 60 }),
        withSpring(0, {}, isFinished => {
          if (isFinished) {
            runOnJS(onComplete)()
            runOnJS(vibratePhone)()
          }
        })
      )
    }

    function vibratePhone(): void {
      Vibration.vibrate(
        Platform.OS === 'android'
          ? [0, 150, 10, 150, 10, 150, 10, 150, 10, 150]
          : [0, 10, 10, 10, 10]
      )
    }

    const handleInputChange = (text: string): void => {
      const numericInput = text.replace(/[^0-9]/g, '').slice(0, length)
      onChangePin(numericInput)
    }

    const wrongPinAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: wrongPinAnimation.value
        }
      ]
    }))

    useImperativeHandle(ref, () => ({
      focus: () => textInputRef.current?.focus(),
      blur: () => textInputRef.current?.blur(),
      fireWrongPinAnimation,
      startLoadingAnimation,
      stopLoadingAnimation
    }))

    return (
      <TouchableOpacity
        onPress={() => textInputRef.current?.focus()}
        activeOpacity={1}>
        {/* Hidden TextInput for capturing input */}
        <TextInput
          ref={textInputRef}
          style={{ position: 'absolute', opacity: 0 }}
          value={value}
          onChangeText={handleInputChange}
          keyboardType="number-pad"
          maxLength={length}
        />
        {/* Display for input dots */}
        <Animated.View
          style={[
            {
              gap: 15,
              flexDirection: 'row',
              padding: 15,
              justifyContent: 'center'
            },
            wrongPinAnimatedStyle,
            style
          ]}>
          {loadingDotAnimations.map((animation, index) => {
            const shouldFill = index < value.length

            return (
              <AnimatedDot
                key={index}
                shouldFill={shouldFill}
                sharedValue={animation}
              />
            )
          })}
        </Animated.View>
      </TouchableOpacity>
    )
  }
)

PinInput.displayName = 'PinInput'

export type PinInputActions = {
  focus: () => void
  blur: () => void
  fireWrongPinAnimation: (onComplete: () => void) => void
  startLoadingAnimation: () => void
  stopLoadingAnimation: (onComplete: () => void) => void
}

type PinInputProps = {
  value: string
  onChangePin: (pin: string) => void
  length?: 6 | 8
  style?: ViewStyle
}

const AnimatedDot = ({
  shouldFill,
  sharedValue
}: {
  shouldFill: boolean
  sharedValue: SharedValue<number>
}): JSX.Element => {
  const { theme } = useTheme()

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sharedValue.value }]
  }))

  return (
    <Animated.View
      style={[
        {
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: shouldFill ? 'transparent' : theme.colors.$borderPrimary,
          backgroundColor: shouldFill
            ? theme.colors.$textPrimary
            : 'transparent'
        },
        animatedStyle
      ]}
    />
  )
}

const useLoadingDotAnimations = (length: number): SharedValue<number>[] => {
  const loadingDotAnimation1 = useSharedValue(0)
  const loadingDotAnimation2 = useSharedValue(0)
  const loadingDotAnimation3 = useSharedValue(0)
  const loadingDotAnimation4 = useSharedValue(0)
  const loadingDotAnimation5 = useSharedValue(0)
  const loadingDotAnimation6 = useSharedValue(0)
  const loadingDotAnimation7 = useSharedValue(0)
  const loadingDotAnimation8 = useSharedValue(0)

  return useMemo(
    () =>
      [
        loadingDotAnimation1,
        loadingDotAnimation2,
        loadingDotAnimation3,
        loadingDotAnimation4,
        loadingDotAnimation5,
        loadingDotAnimation6,
        loadingDotAnimation7,
        loadingDotAnimation8
      ].slice(0, length),
    [
      loadingDotAnimation1,
      loadingDotAnimation2,
      loadingDotAnimation3,
      loadingDotAnimation4,
      loadingDotAnimation5,
      loadingDotAnimation6,
      loadingDotAnimation7,
      loadingDotAnimation8,
      length
    ]
  )
}
