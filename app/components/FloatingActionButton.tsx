import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import React, { Dispatch, useCallback, useEffect, useMemo } from 'react'
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native'
import { assertNotUndefined } from 'utils/assertions'
import CircularButton from 'components/CircularButton'
import { useApplicationContext } from 'contexts/ApplicationContext'

export type ActionProp = {
  image: React.ReactNode
  onPress: () => void
}

interface FABProps {
  actionItems: Record<string, ActionProp>
  icon: React.ReactNode
  size?: number
  resetOnItemPress?: boolean
  expanded: boolean
  setExpanded: Dispatch<boolean>
}

const springConfig = { damping: 11.5, stiffness: 95 }

const FloatingActionButton = ({
  actionItems,
  expanded,
  icon,
  size = 48,
  setExpanded,
  resetOnItemPress = true
}: FABProps) => {
  const progress = useSharedValue(0)
  const { theme } = useApplicationContext()

  useEffect(() => {
    if (!expanded) {
      progress.value = 0
    }
  }, [expanded, progress])

  function collapse() {
    setExpanded(false)
  }

  const viewAnimatedStyles = useAnimatedStyle(() => {
    return {
      opacity: progress.value
    }
  })
  const buttonAnimatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(progress.value, [0, 1], [1, 1])
        },
        {
          rotate: interpolate(progress.value, [0, 1], [0, 135]) + 'deg'
        }
      ]
    }
  })

  /**
   * Animates elements of the component.
   * Fab rotates
   */
  const animateItems = useCallback(() => {
    // if fab is active (expanded) then we collapse.
    if (expanded) {
      setExpanded(false)
      return
    }
    progress.value = withSpring(1, springConfig)
    setExpanded(true)
  }, [expanded, progress, setExpanded])

  const wrapperStyle = useMemo(() => {
    return {
      alignItems: 'center',
      width: 100,
      backgroundColor: expanded ? theme.colorBg2 : undefined,
      paddingVertical: 24,
      borderRadius: 70
    } as ViewStyle
  }, [expanded, theme.colorBg2])

  const iconStyle = useMemo(() => {
    return [
      styles.btn,
      buttonAnimatedStyles,
      {
        backgroundColor: theme.white,
        width: size,
        height: size,
        borderRadius: size / 2
      }
    ] as ViewStyle[]
  }, [buttonAnimatedStyles, size, theme.white])

  return (
    <Animated.View style={wrapperStyle}>
      <Animated.View
        pointerEvents={expanded ? 'auto' : 'none'}
        style={viewAnimatedStyles}>
        {expanded && (
          <ActionItems
            items={actionItems}
            reset={collapse}
            resetOnItemPress={resetOnItemPress}
          />
        )}
      </Animated.View>
      <Pressable onPress={animateItems}>
        <Animated.View style={iconStyle}>{icon}</Animated.View>
      </Pressable>
    </Animated.View>
  )
}

const ActionItems = ({
  items,
  resetOnItemPress,
  reset
}: {
  items: Record<string, ActionProp>
  resetOnItemPress: boolean
  reset: () => void
}) => {
  const { theme } = useApplicationContext()

  return (
    <>
      {Object.keys(items).map(key => {
        const value = items[key]
        assertNotUndefined(value)
        return (
          <View key={key} style={{ marginBottom: 10 }}>
            <CircularButton
              style={{ backgroundColor: theme.white }}
              image={value.image}
              caption={key}
              onPress={() => {
                if (resetOnItemPress) {
                  reset()
                }
                value.onPress()
              }}
            />
          </View>
        )
      })}
    </>
  )
}

const styles = StyleSheet.create({
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
