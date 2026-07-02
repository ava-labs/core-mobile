import { SxProp } from 'dripsy'
import React, { useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { TextVariant } from '../../theme/tokens/text'
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
  subtitleVariant = 'mono',
  style,
  testID
}: {
  data: GroupListItem[]
  itemHeight?: number
  titleSx?: SxProp
  subtitleSx?: SxProp
  subtitleVariant?: TextVariant
  textContainerSx?: SxProp
  valueSx?: SxProp
  separatorMarginRight?: number
  /** Style override for the outer Animated.View. Merged after the default
   * container styles (full width, rounded surface), so callers can tweak
   * margins, background, etc. */
  style?: StyleProp<ViewStyle>
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()
  const [textMarginLeft, setTextMarginLeft] = useState(0)
  const [expandedStates, setExpandedStates] = useState<boolean[]>(
    data.map(i => i.expanded ?? false)
  )
  const prevExpandedStatesRef = useRef(expandedStates)

  // Emit onAccordionToggle after the state change is committed rather than from
  // inside the state updater. The updater must stay pure (React may re-run it
  // under concurrent rendering / StrictMode), so side effects belong here. We
  // diff against the previously committed values, so the callback fires exactly
  // once per actual toggle and never on mount.
  useEffect(() => {
    expandedStates.forEach((expanded, index) => {
      if (expanded !== prevExpandedStatesRef.current[index]) {
        data[index]?.onAccordionToggle?.(expanded)
      }
    })
    prevExpandedStatesRef.current = expandedStates
  }, [expandedStates, data])

  const handleLayout = (event: LayoutChangeEvent): void => {
    setTextMarginLeft(event.nativeEvent.layout.x)
  }

  const handlePress = (item: GroupListItem, index: number): void => {
    if (item.accordion) {
      // Pure updater: derive next state from prev, no side effects here.
      setExpandedStates(prev =>
        prev.map((value, i) => (i === index ? !(prev[index] ?? false) : value))
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

  const renderTitle = (title: Title, index: number): React.ReactNode => {
    if (typeof title === 'string') {
      return (
        <Text
          numberOfLines={2}
          variant="buttonMedium"
          sx={{
            fontFamily: 'Inter-Medium',
            fontSize: 16,
            color: '$textPrimary',
            ...titleSx
          }}>
          {title}
        </Text>
      )
    }

    if (typeof title === 'function') {
      return title(expandedStates[index] ?? false)
    }

    return title
  }

  const renderSubTitle = (
    subtitle: Subtitle,
    index: number
  ): React.ReactNode => {
    if (typeof subtitle === 'string') {
      return (
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
      )
    }

    if (typeof subtitle === 'function') {
      return subtitle(expandedStates[index] ?? false)
    }

    return subtitle
  }

  return (
    // The surface (radius/background) + caller `style` stay on the outer view so
    // every caller's contract is preserved (StakeDetailScreen overrides the top
    // corner radius, CollectibleDetailsContent positions with `position:
    // absolute`). Only `overflow: 'hidden'` moves to a STATIC inner clip view.
    // Under RN's new architecture (Fabric) on Android, a `LinearTransition` view
    // with `overflow: 'hidden'` settles at a stale (too-short) height when its
    // children grow (accordion expand / async content mount), clipping the tail
    // rows. A non-animated clip measures the real content height, so nothing is
    // cut; the animated view keeps its rounded background via `borderRadius`
    // alone (no clip needed to round a background).
    <Animated.View
      layout={LinearTransition.easing(Easing.inOut(Easing.ease))}
      style={[
        {
          width: '100%',
          borderRadius: 12,
          backgroundColor: theme.colors.$surfaceSecondary
        },
        style
      ]}>
      <View
        style={[
          { borderRadius: 12, overflow: 'hidden' },
          ...((Array.isArray(style) ? style : [style])
            .filter(s => Boolean(s) && typeof s === 'object')
            .map(s => {
              const v = s as ViewStyle
              return {
                borderRadius: v.borderRadius,
                borderTopLeftRadius: v.borderTopLeftRadius,
                borderTopRightRadius: v.borderTopRightRadius,
                borderBottomLeftRadius: v.borderBottomLeftRadius,
                borderBottomRightRadius: v.borderBottomRightRadius
              }
            }))
        ]}>
        {data.map((item, index) => {
          const {
            leftIcon,
            rightIcon,
            title,
            subtitle,
            value,
            accordion,
            onPress,
            onLongPress,
            containerSx,
            hideSeparator,
            disableRowAccessibility
          } = item

          return (
            <View key={index} sx={containerSx}>
              <TouchableOpacity
                accessible={!disableRowAccessibility}
                testID={testID ? testID : `list_item__${title}`}
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
                      gap: 12
                    }}
                    onLayout={handleLayout}>
                    <View sx={{ marginVertical: 14, ...textContainerSx }}>
                      <View
                        sx={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8
                        }}>
                        {renderTitle(title, index)}
                        {rightIcon !== undefined && rightIcon}
                      </View>
                      {renderSubTitle(subtitle, index)}
                    </View>

                    <View
                      sx={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        flex: 1,
                        justifyContent: 'flex-end'
                      }}>
                      {value !== undefined &&
                        (typeof value === 'string' ? (
                          <Text
                            testID={`right_value__${value}`}
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
                {item.bottomAccessory}
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
                    opacity: hideSeparator ? 0 : 1,
                    marginLeft: textMarginLeft,
                    marginRight: separatorMarginRight
                  }}
                />
              )}
            </View>
          )
        })}
      </View>
    </Animated.View>
  )
}

type Title = React.ReactNode | ((expanded: boolean) => React.ReactNode)
type Subtitle = React.ReactNode | ((expanded: boolean) => React.ReactNode)

export type GroupListItem = {
  title: Title
  subtitle?: Subtitle
  value?: React.ReactNode
  onPress?: () => void
  onLongPress?: () => void
  leftIcon?: JSX.Element
  rightIcon?: JSX.Element
  accessory?: JSX.Element
  bottomAccessory?: JSX.Element
  accordion?: JSX.Element
  expanded?: boolean
  /** Called when an accordion row is toggled, with the resulting expanded state. */
  onAccordionToggle?: (expanded: boolean) => void
  containerSx?: SxProp
  hideSeparator?: boolean
  /** When true, sets accessible={false} on the row so child testIDs (e.g. Toggle) are findable by Appium */
  disableRowAccessibility?: boolean
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
