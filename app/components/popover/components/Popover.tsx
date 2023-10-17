import React, { forwardRef, useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { ANIMATION_DURATION } from '../constants'
import { BORDER_RADIUS, POPOVER_WIDTH } from '../constants'
import { PopoverProps } from '../types'
import { Caret } from './Caret'

export const Popover = forwardRef<View, PopoverProps>(function Popover(
  {
    animated = true,
    animationType = 'timing',
    backgroundColor,
    caret: withCaret = true,
    caretPosition = 'center',
    children,
    forceInitialAnimation = false,
    visible = true,
    position = 'bottom',
    style,
    ...extraProps
  },
  ref
) {
  const isHorizontalLayout = position === 'left' || position === 'right'
  const isTopOrLeftLayout = position === 'top' || position === 'left'
  const isBottomOrRightLayout = position === 'right' || position === 'bottom'

  const prevVisible = useRef(visible)
  const opacity = useRef(
    new Animated.Value(
      visible ? (forceInitialAnimation ? 0 : 1) : forceInitialAnimation ? 1 : 0
    )
  ).current

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined
    prevVisible.current = visible

    if (!animated) {
      return
    }

    if (visible && (!prevVisible.current || forceInitialAnimation)) {
      animation = Animated[animationType](opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true
      })
    } else if (!visible && (prevVisible.current || forceInitialAnimation)) {
      animation = Animated[animationType](opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true
      })
    }

    animation?.start()

    return () => animation?.stop()
  }, [animated, animationType, forceInitialAnimation, opacity, visible])

  const renderContent = (): JSX.Element => {
    return <View style={[styles.content, { backgroundColor }]}>{children}</View>
  }

  const caret = (
    <Caret
      align={caretPosition}
      position={position}
      backgroundColor={backgroundColor}
      style={styles.caret}
    />
  )

  const animationTranslation = isHorizontalLayout
    ? {
        translateX: opacity.interpolate({
          inputRange: [0, 1],
          outputRange: position === 'left' ? [5, 0] : [-5, 0]
        })
      }
    : {
        translateY: opacity.interpolate({
          inputRange: [0, 1],
          outputRange: position === 'top' ? [5, 0] : [-5, 0]
        })
      }

  return (
    <View
      ref={ref}
      style={[styles.container, style]}
      pointerEvents={visible ? 'auto' : 'none'}
      {...extraProps}>
      <Animated.View
        style={[
          { opacity, transform: [animationTranslation] },
          isHorizontalLayout && styles.containerHorizontal
        ]}>
        {withCaret && isBottomOrRightLayout && caret}
        {renderContent()}
        {withCaret && isTopOrLeftLayout && caret}
      </Animated.View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    width: POPOVER_WIDTH,
    overflow: 'hidden'
  },
  containerHorizontal: {
    flexDirection: 'row'
  },
  content: {
    flex: 1,
    zIndex: 1,
    borderRadius: BORDER_RADIUS * 2,
    overflow: 'hidden'
  },
  caret: {
    zIndex: 0
  }
})
