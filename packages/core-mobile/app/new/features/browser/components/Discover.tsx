import { alpha, ScrollView, Text, useTheme, View } from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BROWSER_CONTROLS_HEIGHT, HORIZONTAL_MARGIN } from '../consts'
import { DiscoverSuggested } from './DiscoverDapps'
import { DiscoverLearn } from './DiscoverLearn'
import { DiscoverTopProjects } from './DiscoverTopProjects'

export const Discover = (): JSX.Element => {
  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()
  const { theme } = useTheme()

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{
        height: '100%'
      }}
      stickyHeaderIndices={[0]}
      contentContainerStyle={{
        paddingTop: insets.top + 62,
        paddingBottom: BROWSER_CONTROLS_HEIGHT + tabBarHeight
      }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: -insets.top - 26,
            left: 0,
            right: 0,
            zIndex: 1
          }
        ]}>
        <LinearGradient
          style={{
            height: insets.top + 26
          }}
          colors={[
            theme.colors.$surfacePrimary,
            alpha(theme.colors.$surfacePrimary, 0)
          ]}
          start={{
            x: 0,
            y: 0
          }}
          end={{
            x: 0,
            y: 1
          }}
        />
      </Animated.View>
      <View style={{ paddingHorizontal: HORIZONTAL_MARGIN, gap: 8 }}>
        <Text variant="heading2">Discover</Text>
        <Text variant="body1">
          Discover a wide variety of apps built on the Avalanche ecosystem
        </Text>
      </View>

      <DiscoverSuggested />

      <View>
        <View style={{ paddingHorizontal: HORIZONTAL_MARGIN }}>
          <Text variant="heading3">Top projects</Text>
          <Text
            variant="heading3"
            sx={{
              color: '$textSecondary'
            }}>
            over the last 7 days
          </Text>
        </View>
        <DiscoverTopProjects />
      </View>

      <View
        style={{
          gap: 12
        }}>
        <View style={{ paddingHorizontal: HORIZONTAL_MARGIN }}>
          <Text variant="heading3">Learn</Text>
        </View>
        <DiscoverLearn />
      </View>
    </ScrollView>
  )
}
