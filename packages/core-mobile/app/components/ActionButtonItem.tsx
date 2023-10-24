import React, { FC } from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue
} from 'react-native-reanimated'
import { noop } from 'rxjs'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from './AvaText'

interface Props {
  angle?: number
  progress?: SharedValue<number>
  radius?: number
  buttonColor?: string
  onPress?: () => void
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  activeStyle?: StyleProp<ViewStyle>
  active?: boolean
  title?: string
  size?: number
  vertical?: boolean
  selfContained?: boolean
}

const ActionButtonItem: FC<Props> = ({
  radius = 100,
  angle = 0,
  progress,
  size = 48,
  active = false,
  onPress = noop,
  buttonColor,
  style,
  activeStyle,
  title,
  vertical,
  selfContained,
  children,
  ...rest
}) => {
  const { theme } = useApplicationContext()
  const offsetX = vertical ? 0 : radius * Math.cos(angle)
  const offsetY = vertical ? -160 : radius * Math.sin(angle)
  const animatedStyles = useAnimatedStyle(() => {
    const progressValue = progress?.value ?? 1

    return {
      opacity: progressValue,
      transform: [
        {
          translateY: interpolate(progressValue, [0, 1], [0, offsetY])
        },
        {
          translateX: interpolate(progressValue, [0, 1], [0, offsetX])
        },
        {
          scale: interpolate(progressValue, [0, 1], [0, 1])
        }
      ]
    }
  })

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size
        },
        animatedStyles
      ]}>
      {!selfContained ? (
        <TouchableOpacity
          {...rest}
          style={{ flex: 1, alignItems: 'center' }}
          activeOpacity={0.85}
          onPress={onPress}>
          <View
            style={[
              styles.actionButton,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: buttonColor
              },
              style,
              active ? activeStyle : undefined
            ]}>
            {children}
          </View>
          {title && (
            <>
              <AvaText.Caption
                color={theme.white}
                textStyle={{
                  fontSize: 11,
                  position: 'absolute',
                  top: 55,
                  width: 100,
                  textAlign: 'center'
                }}>
                {title}
              </AvaText.Caption>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View
          style={{
            width: 204,
            height: 200,
            backgroundColor: theme.alternateBackground,
            borderRadius: 8,
            padding: 16,
            justifyContent: 'space-between',
            alignSelf: 'center',
            top: -80
          }}>
          {children}
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
    shadowOpacity: 0.3,
    marginHorizontal: 8,
    shadowOffset: {
      width: 0,
      height: 1
    },
    overflow: 'visible',
    shadowColor: '#444',
    shadowRadius: 1,
    position: 'absolute'
  }
})

export default ActionButtonItem
