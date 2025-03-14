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
import { useTheme } from '../../hooks'

export const PinInput = forwardRef<PinInputActions, PinInputProps>(
  ({ value, onChangePin, length = 6, disabled, style }, ref) => {
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
                withDelay(
                  index * LoadingDotAnimationConfig.delayPerDot,
                  withTiming(-LoadingDotAnimationConfig.translationDistance, {
                    duration: LoadingDotAnimationConfig.duration
                  })
                ),
                withTiming(0, { duration: LoadingDotAnimationConfig.duration })
              )

              setTimeout(() => {
                runOnJS(resolve)()
              }, index * LoadingDotAnimationConfig.delayPerDot + LoadingDotAnimationConfig.duration * 2)
            })
        )

        return Promise.all(animationPromises).then(() => {
          if (isLoading.get()) {
            runOnJS(triggerAnimations)()
          }
        })
      }

      isLoading.value = true
      runOnJS(triggerAnimations)()
    }

    const stopLoadingAnimation = (onComplete?: () => void): void => {
      isLoading.value = false
      loadingDotAnimations.forEach(animation => {
        cancelAnimation(animation)
        animation.value = 0
      })

      if (onComplete) {
        runOnJS(onComplete)()
      }
    }

    const fireWrongPinAnimation = (onComplete: () => void): void => {
      wrongPinAnimation.value = withSequence(
        withTiming(WrongPinAnimationConfig.maxTranslationDistance, {
          duration: WrongPinAnimationConfig.maxDuration
        }),
        withTiming(-WrongPinAnimationConfig.maxTranslationDistance, {
          duration: WrongPinAnimationConfig.maxDuration
        }),
        withTiming(
          WrongPinAnimationConfig.maxTranslationDistance -
            WrongPinAnimationConfig.translationDelta,
          {
            duration:
              WrongPinAnimationConfig.maxDuration -
              WrongPinAnimationConfig.durationDelta
          }
        ),
        withTiming(
          -(
            WrongPinAnimationConfig.maxTranslationDistance -
            WrongPinAnimationConfig.translationDelta
          ),
          {
            duration:
              WrongPinAnimationConfig.maxDuration -
              WrongPinAnimationConfig.durationDelta
          }
        ),
        withTiming(
          WrongPinAnimationConfig.maxTranslationDistance -
            WrongPinAnimationConfig.translationDelta * 2,
          {
            duration:
              WrongPinAnimationConfig.maxDuration -
              WrongPinAnimationConfig.durationDelta * 2
          }
        ),
        withTiming(
          -(
            WrongPinAnimationConfig.maxTranslationDistance -
            WrongPinAnimationConfig.translationDelta * 2
          ),
          {
            duration:
              WrongPinAnimationConfig.maxDuration -
              WrongPinAnimationConfig.durationDelta * 2
          }
        ),
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
      isFocused: () => textInputRef.current?.isFocused() ?? false,
      fireWrongPinAnimation,
      startLoadingAnimation,
      stopLoadingAnimation
    }))

    return (
      <TouchableOpacity
        disabled={disabled}
        onPress={() => textInputRef.current?.focus()}
        activeOpacity={1}>
        {/* Hidden TextInput for capturing input */}
        <TextInput
          testID="pin_input"
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
  isFocused: () => boolean
  fireWrongPinAnimation: (onComplete: () => void) => void
  startLoadingAnimation: () => void
  stopLoadingAnimation: (onComplete?: () => void) => void
}

type PinInputProps = {
  value: string
  onChangePin: (pin: string) => void
  length?: 6 | 8
  style?: ViewStyle
  disabled?: boolean
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

const WrongPinAnimationConfig = {
  maxDuration: 80,
  durationDelta: 10,
  maxTranslationDistance: 12,
  translationDelta: 4
}

const LoadingDotAnimationConfig = {
  duration: 200,
  delayPerDot: 50,
  translationDistance: 15
}
