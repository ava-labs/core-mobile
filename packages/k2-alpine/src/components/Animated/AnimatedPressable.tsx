import { Pressable } from 'dripsy'
import React, { memo } from 'react'
import { GestureResponderEvent, PressableProps } from 'react-native'
import Animated, { AnimatedProps } from 'react-native-reanimated'
import { usePressableGesture } from '../../hooks/usePressableGesture'

export interface AnimatedPressableProps extends AnimatedProps<PressableProps> {
  onPress?: (event: GestureResponderEvent) => void
}

const AnimatedPress = Animated.createAnimatedComponent(Pressable)

export const AnimatedPressable = memo(
  ({ children, onPress, ...props }: AnimatedPressableProps) => {
    const {
      onTouchStart,
      onTouchMove,
      onTouchCancel,
      onTouchEnd,
      animatedStyle
    } = usePressableGesture(onPress)

    return (
      <AnimatedPress
        disabled={props.disabled}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchCancel={onTouchCancel}
        onTouchEnd={onTouchEnd}
        {...props}
        style={[props.style, animatedStyle]}>
        {children}
      </AnimatedPress>
    )
  }
)
