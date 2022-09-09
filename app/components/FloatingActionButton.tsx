import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import ActionButtonItem from 'components/ActionButtonItem'

interface FABProps {
  children: React.ReactNode
  backgroundColor?: string
  changeBackgroundColor?: string
  icon?: React.ReactNode
  iconText?: string
  iconTextColor?: string
  changeIconTextColor?: string
  scale?: number
  degrees?: number
  size?: number
  radius?: number
  resetOnItemPress?: boolean
}

const FloatingActionButton = React.forwardRef(
  (
    {
      children,
      backgroundColor = 'blue',
      changeBackgroundColor = 'blue',
      icon,
      iconText,
      iconTextColor,
      changeIconTextColor,
      scale = 1,
      degrees = 135,
      size = 48,
      radius = 100,
      resetOnItemPress = true
    }: FABProps,
    ref
  ) => {
    const anim = useRef(new Animated.Value(0)).current
    const [isActive, setIsActive] = useState(false)
    const timeout = useRef<NodeJS.Timeout | null>(null)

    useImperativeHandle(ref, () => ({
      collapse: () => {
        reset()
      }
    }))

    /**
     * This clears the timout once it's used.
     */
    useEffect(() => {
      return () => {
        if (timeout.current != null) {
          clearTimeout(timeout.current)
        }
      }
    })

    /**
     * Resets Fab with animations
     */
    const reset = useCallback(() => {
      Animated.spring(anim, {
        toValue: 0,
        speed: 3,
        bounciness: 2,
        useNativeDriver: false
      }).start(() => {
        setIsActive(false)
      })
    }, [anim])

    /**
     * Animates elements of the component.
     * Fab rotates
     * Fab Items spring out
     */
    const animateItems = useCallback(() => {
      // if fab is active (expanded) then we collapse.
      if (isActive) {
        reset()
        return
      }

      Animated.spring(anim, {
        toValue: 1,
        speed: 3,
        bounciness: 2,
        useNativeDriver: false
      }).start()

      setIsActive(true)
    }, [isActive, anim, reset])

    /**
     * Render methods and start/end values for fab item animations and positions
     */
    const renderActionItems = useMemo(() => {
      if (!isActive) {
        return null
      }

      const startDegree = 180
      const endDegree = 360
      const startRadian = (startDegree * Math.PI) / 180
      const endRadian = (endDegree * Math.PI) / 180

      const validChildren: React.ReactElement[] = []

      React.Children.forEach(children, child => {
        if (React.isValidElement(child) && child.type === React.Fragment) {
          React.Children.forEach(child.props.children, item => {
            const isValidButton =
              React.isValidElement(item) && item.type === ActionButtonItem
            isValidButton && validChildren.push(item)
          })
        } else {
          const isValidButton =
            React.isValidElement(child) && child.type === ActionButtonItem
          isValidButton && validChildren.push(child)
        }
      })

      const childrenCount = validChildren.length

      let offset = 0
      if (childrenCount !== 1) {
        offset = (endRadian - startRadian) / (childrenCount - 1)
      }

      return validChildren.map((button, index) => {
        return (
          <View
            key={index}
            pointerEvents="box-none"
            style={[
              styles.overlay,
              styles.actionContainer,
              { alignItems: 'center', justifyContent: 'center', top: 100 }
            ]}>
            <ActionButtonItem
              position={'center'}
              anim={anim}
              size={48}
              radius={radius}
              angle={startRadian + index * offset}
              btnColor={backgroundColor}
              {...button.props}
              onPress={() => {
                if (resetOnItemPress) {
                  timeout.current = setTimeout(() => {
                    reset()
                  }, 200)
                }
                button.props?.onPress()
              }}
            />
          </View>
        )
      })
    }, [
      isActive,
      anim,
      backgroundColor,
      children,
      radius,
      reset,
      resetOnItemPress
    ])

    /**
     * FAB render method and interpolation
     */
    const renderButtonIcon = useMemo(() => {
      if (icon) {
        return icon
      }

      return (
        <Animated.Text
          style={[
            styles.btnText,
            {
              color: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [iconTextColor ?? '', changeIconTextColor ?? '']
              })
            }
          ]}>
          {iconText}
        </Animated.Text>
      )
    }, [anim, changeIconTextColor, icon, iconText, iconTextColor])

    return (
      <View
        pointerEvents="box-none"
        style={[styles.overlay, { height: 400, top: -100 }]}>
        <Animated.View
          pointerEvents={isActive ? 'auto' : 'none'}
          style={{
            opacity: anim
          }}>
          <LinearGradient
            nativeID={'linearGradient'}
            pointerEvents={'none'}
            colors={['transparent', '#000000D9', '#000000']}
            style={{
              height: 130,
              bottom: 30
            }}
          />
          {children && renderActionItems}
        </Animated.View>
        <Pressable
          style={{
            alignSelf: 'center',
            bottom: 60
          }}
          onPress={() => {
            if (children) {
              animateItems()
            }
          }}>
          <Animated.View
            style={[
              styles.btn,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [backgroundColor, changeBackgroundColor]
                }),
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, scale]
                    })
                  },
                  {
                    rotate: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', degrees + 'deg']
                    })
                  }
                ]
              }
            ]}>
            {renderButtonIcon}
          </Animated.View>
        </Pressable>
      </View>
    )
  }
)

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'transparent'
  },
  actionContainer: {
    flexDirection: 'column',
    padding: 10
  },
  actionBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowColor: '#444',
    shadowRadius: 1
  },
  btnText: {
    marginTop: -4,
    fontSize: 24,
    backgroundColor: 'transparent',
    position: 'relative'
  }
})

export default FloatingActionButton
