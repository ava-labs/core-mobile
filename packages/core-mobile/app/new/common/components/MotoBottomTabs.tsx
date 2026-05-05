import {
  alpha,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { Pressable, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { SvgProps } from 'react-native-svg'

// Hello UI bottom navigation: each tab is icon + label (label below
// icon). Active tab puts a Vellum-87 60x30 pill behind just the icon —
// label stays plain. Bar background is Vellum 96.
//
// Used in limited mode in place of the legacy SegmentedControl. Kept
// intentionally simple (no animated indicator slide) to match Figma.

export type MotoBottomTabItem = {
  title: string
  icon: React.FC<SvgProps>
}

export const MotoBottomTabs = ({
  items,
  selectedSegmentIndex,
  onSelectSegment,
  style
}: {
  items: MotoBottomTabItem[]
  selectedSegmentIndex: SharedValue<number>
  onSelectSegment: (index: number) => void
  style?: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.$surfaceSecondary,
          paddingTop: 8,
          // Extend the bar bg to the very bottom edge so the Vellum-96
          // fill reaches the system gesture bar; insets.bottom keeps the
          // labels above the gesture indicator.
          paddingBottom: insets.bottom,
          flexDirection: 'row'
        },
        style
      ]}>
      {items.map((item, index) => (
        <Tab
          key={item.title}
          item={item}
          index={index}
          selectedSegmentIndex={selectedSegmentIndex}
          onPress={() => onSelectSegment(index)}
        />
      ))}
    </View>
  )
}

const Tab = ({
  item,
  index,
  selectedSegmentIndex,
  onPress
}: {
  item: MotoBottomTabItem
  index: number
  selectedSegmentIndex: SharedValue<number>
  onPress: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const Icon = item.icon

  // Active state derived from the shared value so segmented-control
  // consumers (which already drive a SharedValue<number>) keep working.
  const activePillStyle = useAnimatedStyle(() => ({
    opacity: selectedSegmentIndex.value === index ? 1 : 0
  }))

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 8,
        gap: 4
      }}>
      <View
        style={{
          width: 60,
          height: 30,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 30,
              backgroundColor: alpha(theme.colors.$textPrimary, 0.1)
            },
            activePillStyle
          ]}
        />
        <Icon width={20} height={20} color={theme.colors.$textPrimary} />
      </View>
      <Text
        sx={{
          fontFamily: 'Rookery-Bold',
          fontSize: 12,
          lineHeight: 16,
          color: '$textPrimary'
        }}>
        {item.title}
      </Text>
    </Pressable>
  )
}

export const MotoTabIcons = {
  Layers: Icons.Navigation.Layers,
  History: Icons.Navigation.History
}
