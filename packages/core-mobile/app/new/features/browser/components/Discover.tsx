import { alpha, Text, useTheme, View } from '@avalabs/k2-alpine'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HORIZONTAL_MARGIN } from '../consts'
import { DiscoverCollectibles } from './DiscoverCollectibles'
import { DiscoverEcosystemProjects } from './DiscoverEcosystemProjects'
import { DiscoverFeaturedProjects } from './DiscoverFeaturedProjects'
import { DiscoverLearn } from './DiscoverLearn'

export const Discover = (): JSX.Element => {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}
      nestedScrollEnabled
      stickyHeaderIndices={[0]}
      contentContainerStyle={{
        paddingTop: insets.top + 76
      }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1
          }
        ]}>
        <LinearGradient
          style={{
            height: insets.top + 60
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
          {`Discover a wide variety of apps built on\nthe Avalanche ecosystem`}
        </Text>
      </View>

      <DiscoverEcosystemProjects />

      <View
        style={{
          gap: HORIZONTAL_MARGIN / 2
        }}>
        <View style={{ paddingHorizontal: HORIZONTAL_MARGIN }}>
          <Text variant="heading3">Trending projects</Text>
        </View>
        <DiscoverFeaturedProjects />
      </View>

      <DiscoverCollectibles />

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
