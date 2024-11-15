import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react'
import {
  Animated,
  Platform,
  TextInput,
  Vibration,
  ViewStyle
} from 'react-native'
import { TouchableOpacity } from '../Primitives'
import { useTheme } from '../..'

export const PinInput = forwardRef<PinInputActions, PinInputProps>(
  ({ value, onChangePin, length = 6, style }, ref) => {
    const { theme } = useTheme()
    const textInputRef = useRef<TextInput>(null)
    const wrongPinAnimation = useRef(new Animated.Value(0)).current

    const wrongPinAnimationSequence = useMemo(() => {
      const animationValues = [
        { toValue: 12, duration: 80 },
        { toValue: -12, duration: 80 },
        { toValue: 8, duration: 70 },
        { toValue: -8, duration: 70 },
        { toValue: 4, duration: 60 },
        { toValue: -4, duration: 60 }
      ]

      // Create the animation sequence
      return Animated.sequence([
        ...animationValues.map(({ toValue, duration }) =>
          Animated.timing(wrongPinAnimation, {
            toValue,
            duration,
            useNativeDriver: true
          })
        ),
        Animated.spring(wrongPinAnimation, {
          toValue: 0,
          useNativeDriver: true
        })
      ])
    }, [wrongPinAnimation])

    const loadingDotAnimations = useRef(
      Array.from({ length }, () => new Animated.Value(0))
    )

    useEffect(() => {
      loadingDotAnimations.current = Array.from(
        { length },
        () => new Animated.Value(0)
      )
    }, [loadingDotAnimations, length])

    const loadingAnimationSequence = Animated.loop(
      Animated.parallel(
        loadingDotAnimations.current.map((anim, index) => {
          return Animated.sequence([
            Animated.delay(index * 50),
            Animated.timing(anim, {
              toValue: -15, // Move up
              duration: 200,
              useNativeDriver: true
            }),
            Animated.timing(anim, {
              toValue: 0, // Move back down
              duration: 200,
              useNativeDriver: true
            })
          ])
        })
      )
    )

    const startLoadingAnimation = (): void => {
      loadingAnimationSequence.start()
    }

    const stopLoadingAnimation = (onComplete: () => void): void => {
      loadingAnimationSequence.stop()

      loadingDotAnimations.current.forEach(anim => anim.setValue(0)) // Reset animation values
      onComplete()
    }

    const fireWrongPinAnimation = useCallback(
      (onComplete: () => void) => {
        wrongPinAnimationSequence.start(() => {
          wrongPinAnimationSequence.reset()
          wrongPinAnimation.setValue(0) // Reset jiggle animation value after the animation is done
          onComplete() // Call onComplete callback when animation is finished
        })
        vibratePhone()
      },
      [wrongPinAnimation, wrongPinAnimationSequence]
    )

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
            {
              transform: [
                {
                  translateX: wrongPinAnimation
                }
              ]
            },
            style
          ]}>
          {Array.from({ length }).map((_, index) => {
            const shouldFill = index < value.length

            return (
              <Animated.View
                key={index}
                style={[
                  {
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: shouldFill
                      ? 'transparent'
                      : theme.colors.$borderPrimary,
                    backgroundColor: shouldFill
                      ? theme.colors.$textPrimary
                      : 'transparent'
                  },
                  loadingDotAnimations.current[index]
                    ? {
                        transform: [
                          { translateY: loadingDotAnimations.current[index] }
                        ]
                      }
                    : {}
                ]}
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
