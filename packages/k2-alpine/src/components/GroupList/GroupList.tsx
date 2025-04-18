import { SxProp } from 'dripsy'
import React, { useEffect, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { TextVariant } from 'src/theme/tokens/text'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { Text, TouchableOpacity, View } from '../Primitives'
import { Separator } from '../Separator/Separator'

export const GroupList = ({
  data,
  itemHeight,
  titleSx,
  subtitleSx,
  valueSx,
  textContainerSx,
  separatorMarginRight,
  subtitleVariant = 'mono'
}: {
  data: GroupListItem[]
  itemHeight?: number
  titleSx?: SxProp
  subtitleSx?: SxProp
  subtitleVariant?: TextVariant
  textContainerSx?: SxProp
  valueSx?: SxProp
  separatorMarginRight?: number
}): JSX.Element => {
  const { theme } = useTheme()
  const [textMarginLeft, setTextMarginLeft] = useState(0)
  const [expandedStates, setExpandedStates] = useState<boolean[]>(
    data.map(() => false)
  )

  const handleLayout = (event: LayoutChangeEvent): void => {
    setTextMarginLeft(event.nativeEvent.layout.x)
  }

  const handlePress = (item: GroupListItem, index: number): void => {
    if (item.accordion) {
      setExpandedStates(prev =>
        prev.map((value, i) => (i === index ? !value : value))
      )
    } else {
      item.onPress?.()
    }
  }

  const renderAccessory = (
    item: GroupListItem,
    index: number
  ): JSX.Element | undefined => {
    if (item.accessory) return item.accessory

    if (item.accordion) {
      return <AnimatedChevron expanded={expandedStates[index] ?? false} />
    }

    if (item.onPress) {
      return (
        <Icons.Navigation.ChevronRight color={theme.colors.$textSecondary} />
      )
    }
  }

  return (
    <Animated.View
      layout={LinearTransition.easing(Easing.inOut(Easing.ease))}
      style={{
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.colors.$surfaceSecondary
      }}>
      {data.map((item, index) => {
        const {
          leftIcon,
          rightIcon,
          title,
          subtitle,
          value,
          accordion,
          onPress,
          onLongPress
        } = item

        return (
          <View key={index}>
            <TouchableOpacity
              onPress={() => handlePress(item, index)}
              disabled={!onPress && !accordion}
              onLongPress={onLongPress}>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: itemHeight,
                  gap: 16,
                  paddingHorizontal: 16
                }}>
                {leftIcon}
                <View
                  sx={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 28
                  }}
                  onLayout={handleLayout}>
                  <View sx={{ marginVertical: 14, ...textContainerSx }}>
                    <View
                      sx={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                      }}>
                      <Text
                        variant="buttonMedium"
                        sx={{
                          fontFamily: 'Inter-Medium',
                          fontSize: 16,
                          color: '$textPrimary',
                          ...titleSx
                        }}>
                        {title}
                      </Text>
                      {rightIcon !== undefined && rightIcon}
                    </View>
                    {subtitle && (
                      <Text
                        variant={subtitleVariant}
                        sx={{
                          color: '$textSecondary',
                          fontSize: 13,
                          lineHeight: 18,
                          ...subtitleSx
                        }}>
                        {subtitle}
                      </Text>
                    )}
                  </View>

                  <View
                    sx={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4
                    }}>
                    {value !== undefined &&
                      (typeof value === 'string' ? (
                        <Text
                          testID={`right_value__${title}`}
                          variant="body1"
                          numberOfLines={1}
                          sx={{ color: '$textSecondary', ...valueSx }}>
                          {value}
                        </Text>
                      ) : (
                        value
                      ))}
                    {renderAccessory(item, index)}
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {accordion !== undefined && expandedStates[index] && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Separator
                  sx={{
                    marginLeft: textMarginLeft,
                    marginRight: separatorMarginRight
                  }}
                />
                {accordion}
              </Animated.View>
            )}
            {index < data.length - 1 && (
              <Separator
                sx={{
                  marginLeft: textMarginLeft,
                  marginRight: separatorMarginRight
                }}
              />
            )}
          </View>
        )
      })}
    </Animated.View>
  )
}

export type GroupListItem = {
  title: string
  subtitle?: string
  value?: React.ReactNode
  onPress?: () => void
  onLongPress?: () => void
  leftIcon?: JSX.Element
  rightIcon?: JSX.Element
  accessory?: JSX.Element
  accordion?: JSX.Element
}

const AnimatedChevron = ({ expanded }: { expanded: boolean }): JSX.Element => {
  const { theme } = useTheme()
  const rotation = useSharedValue(expanded ? 1 : 0)

  useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, { duration: 300 })
  }, [expanded, rotation])

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = `${rotation.value * 180 + 90}deg`
    return {
      transform: [{ rotate }]
    }
  })

  return (
    <Animated.View style={[{ marginRight: -6 }, animatedStyle]}>
      <Icons.Navigation.ChevronRight color={theme.colors.$textSecondary} />
    </Animated.View>
  )
}
