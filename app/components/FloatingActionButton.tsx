import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import ActionButtonItem from 'components/ActionButtonItem'
import LinearGradientSVG from 'components/svg/LinearGradientSVG'

interface Props {
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

const FloatingActionButton: FC<Props> = ({
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
}) => {
  const anim = useRef(new Animated.Value(0)).current
  const [isActive, setIsActive] = useState(false)
  let timeout: NodeJS.Timeout | null

  /**
   * This clears the timout once it's used.
   */
  useEffect(() => {
    return () => {
      if (timeout != null) {
        clearTimeout(timeout)
      }
    }
  })

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
  }, [isActive])

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
  }, [isActive])

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
      const isValidButton =
        React.isValidElement(child) && child.type === ActionButtonItem
      isValidButton && validChildren.push(child)
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
                timeout = setTimeout(() => {
                  reset()
                }, 200)
              }
              button.props?.onPress()
            }}
          />
        </View>
      )
    })
  }, [isActive])

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
  }, [])

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { height: 400, top: -100 }]}>
      <Animated.View
        pointerEvents={isActive ? 'auto' : 'none'}
        style={{
          opacity: anim
        }}>
        <View
          style={{
            height: 130,
            bottom: 30
          }}>
          <LinearGradientSVG
            colorFrom={'#000000D9'}
            colorTo={'#000000'}
            opacityFrom={0.5}
            opacityTo={1}
          />
        </View>
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
