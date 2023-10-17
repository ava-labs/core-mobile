import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Backdrop } from './components/Backdrop'
import { Popover } from './components/Popover'
import type { PopableManager } from './usePopable'
import { PopableProps } from './types'
import { DEFAULT_LAYOUT } from './constants'

export const Popable = forwardRef<PopableManager, PopableProps>(
  function Popable(
    {
      animated,
      animationType,
      backgroundColor,
      children,
      caret,
      caretPosition,
      content,
      numberOfLines,
      onAction,
      position = 'top',
      style,
      visible,
      wrapperStyle
    },
    ref
  ) {
    const dimensions = useWindowDimensions()
    const [popoverVisible, setPopoverVisible] = useState(false)
    const [popoverOffset, setPopoverOffset] = useState({
      left: 0,
      top: 0
    })
    const [popoverLayout, setPopoverLayout] = useState(DEFAULT_LAYOUT)
    const [popoverPagePosition, setPopoverPagePosition] = useState({
      left: 0,
      top: 0
    })
    const [childrenLayout, setChildrenLayout] = useState(DEFAULT_LAYOUT)
    const isInteractive = typeof visible === 'undefined'
    const isPopoverVisible = isInteractive ? popoverVisible : visible
    const childrenRef = useRef<View>(null)
    const popoverRef = useRef<View>(null)

    useImperativeHandle(ref, () => ({
      show: () => setPopoverVisible(true),
      hide: () => setPopoverVisible(false)
    }))

    const handleOnPress = (): void => {
      if (!visible && isInteractive) {
        popoverRef.current?.measure((_x, _y, _width, _height, pageX, pageY) => {
          setPopoverPagePosition({ left: pageX, top: pageY })
        })
      }

      onAction?.(!visible)
      setPopoverVisible(!visible)
    }

    const handleHidePopover = useCallback(() => {
      setPopoverVisible(false)
      onAction?.(false)
    }, [onAction])

    const handlePopoverLayout = useCallback(() => {
      popoverRef.current?.measureInWindow((x, y, width, height) => {
        setPopoverLayout({ x, y, width, height })
      })
    }, [popoverRef])

    const handleChildrenLayout = useCallback(() => {
      childrenRef.current?.measureInWindow((x, y, width, height) => {
        setChildrenLayout({ x, y, width, height })
      })
    }, [childrenRef])

    useEffect(() => {
      let left = 0
      let top = 0

      switch (position) {
        case 'right':
        case 'left':
          top = (popoverLayout.height - childrenLayout.height) / 2
          break

        case 'top':
        case 'bottom':
          left = (popoverLayout.width - childrenLayout.width) / 2
          if (childrenLayout.x < left) {
            left = 0
          }
          if (
            childrenLayout.x + childrenLayout.width + left >
            dimensions.width
          ) {
            left = left * 2
          }
          break
      }
      setPopoverOffset({ left, top })
    }, [position, popoverLayout, childrenLayout, dimensions.width])

    const sharedPopoverProps = {
      animated,
      animationType,
      backgroundColor,
      caret,
      caretPosition,
      children: content,
      numberOfLines,
      position
    }

    return (
      <View style={[styles.container, wrapperStyle]}>
        <Backdrop
          visible={isInteractive && popoverVisible}
          onPress={handleHidePopover}
          popoverRef={popoverRef}
          childrenRef={childrenRef}>
          {
            // Backdrop renders the same popover because:
            // since the backdrop adds a layer on top of the screen to
            // detect any "outside popover press", the inner popover becomes
            // unreachable: the upper layer would keep all the touch events.
            // Because the backdrop uses a modal as a layer, we render that
            // same popover inside the modal, and hide the initial one
            // underneath (which explains why the popover below this one has
            // `visible` set to `false`)
            <Popover
              {...sharedPopoverProps}
              forceInitialAnimation
              visible={isPopoverVisible}
              style={[
                {
                  position: 'absolute',
                  transform: [
                    { translateX: popoverPagePosition.left },
                    { translateY: popoverPagePosition.top }
                  ]
                },
                style
              ]}
            />
          }
        </Backdrop>

        <Popover
          ref={popoverRef}
          {...sharedPopoverProps}
          onLayout={handlePopoverLayout}
          visible={false}
          style={[
            position === 'top' && styles.popoverTop,
            position === 'bottom' && styles.popoverBottom,
            position === 'left' && {
              alignItems: 'flex-end',
              right: childrenLayout.width
            },
            position === 'right' && { left: childrenLayout.width },
            {
              position: 'absolute',
              transform: [
                { translateX: popoverOffset.left * -1 },
                { translateY: popoverOffset.top * -1 }
              ]
            },
            style
          ]}
        />

        <Pressable
          ref={childrenRef}
          onLayout={handleChildrenLayout}
          onPress={handleOnPress}>
          {children}
        </Pressable>
      </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1
  },
  popoverTop: {
    bottom: '100%'
  },
  popoverBottom: {
    top: '100%'
  }
})
