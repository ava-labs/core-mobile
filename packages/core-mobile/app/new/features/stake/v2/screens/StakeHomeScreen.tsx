import {
  alpha,
  AnimatedPressable,
  Chip,
  Icons,
  NavigationTitleHeader,
  ScrollView,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { StuckFundsBanner } from 'features/swap/components/StuckFundsBanner'
import {
  StakeCardList,
  StakeCardListHeaderProps
} from '../components/StakeCardList'
import { Banner } from '../components/Banner'
import { CctBanner } from '../components/CctBanner'

// Width of the right-edge fade overlay on the chip scroll. Matches the
// pattern used by TradeFilters so trailing chips fade into the screen
// background instead of butting up against the Search button.
const CHIP_FADE_WIDTH = 42

export const StakeHomeScreen = (): JSX.Element => {
  const frame = useSafeAreaFrame()
  const headerHeight = useEffectiveHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()
  const { theme } = useTheme()
  const { navigate } = useRouter()

  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }, [])

  const header = useMemo(() => <NavigationTitleHeader title={'Stake'} />, [])

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: header,
    targetLayout: headerLayout,
    hasSeparator: false
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const tabHeight = useMemo(() => {
    return frame.height - headerHeight
  }, [frame.height, headerHeight])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: tabBarHeight + 32,
      paddingTop: 10,
      minHeight: tabHeight
    }
  }, [tabBarHeight, tabHeight])

  const handleSearchPress = useCallback(() => {
    navigate({ pathname: '/stakeSearch' })
  }, [navigate])

  const renderHeader = useCallback(
    ({ isEmpty, filter }: StakeCardListHeaderProps): JSX.Element => {
      return (
        <View
          sx={{
            backgroundColor: theme.colors.$surfacePrimary,
            paddingBottom: 16
          }}>
          <Animated.View
            onLayout={handleHeaderLayout}
            style={[
              {
                paddingHorizontal: 16,
                marginTop: 6,
                marginBottom: 16,
                backgroundColor: theme.colors.$surfacePrimary,
                gap: 7
              },
              animatedHeaderStyle
            ]}>
            <Text variant="heading2">Stake</Text>
            <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
              Stake your AVAX and earn rewards for securing the Avalanche
              Network
            </Text>
          </Animated.View>
          {/* Stuck-funds banner — stranded cross-chain AVAX. Self-hides (and
              reserves no space) when none. */}
          <StuckFundsBanner sx={{ marginHorizontal: 16, marginBottom: 16 }} />
          <Banner />
          {!isEmpty && (
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 20,
                paddingRight: 16,
                gap: 8
              }}>
              <View sx={{ flex: 1, overflow: 'hidden' }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    flexDirection: 'row',
                    gap: 8,
                    paddingLeft: 16,
                    paddingRight: CHIP_FADE_WIDTH
                  }}>
                  {filter.data[0]?.items.map(item => (
                    <Chip
                      key={item.id}
                      size="large"
                      isSelected={item.id === filter.selected}
                      onPress={() => filter.onSelected(item.id)}
                      style={{ minWidth: 40 }}>
                      {item.title}
                    </Chip>
                  ))}
                </ScrollView>
                <LinearGradient
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: CHIP_FADE_WIDTH
                  }}
                  colors={[
                    alpha(theme.colors.$surfacePrimary, 0),
                    theme.colors.$surfacePrimary
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <AnimatedPressable
                onPress={handleSearchPress}
                accessibilityRole="button"
                accessibilityLabel="Search stakes"
                style={{
                  backgroundColor: theme.colors.$surfaceSecondary,
                  borderRadius: 1000,
                  height: 27,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12
                }}>
                <Icons.Custom.Search
                  color={theme.colors.$textPrimary}
                  width={14}
                  height={14}
                />
                <Text
                  variant="buttonSmall"
                  sx={{ color: theme.colors.$textSecondary }}>
                  Search
                </Text>
              </AnimatedPressable>
            </View>
          )}
          {/* CCT banner — points stakers to Swap for P→C transfers. Self-hides
              (and reserves no space) when dismissed or nothing is claimable. */}
          <CctBanner sx={{ marginTop: 16, marginHorizontal: 16 }} />
        </View>
      )
    },
    [
      theme.colors.$surfacePrimary,
      theme.colors.$surfaceSecondary,
      theme.colors.$textPrimary,
      theme.colors.$textSecondary,
      handleHeaderLayout,
      animatedHeaderStyle,
      handleSearchPress
    ]
  )

  return (
    <BlurredBarsContentLayout>
      <StakeCardList
        onScroll={onScroll}
        containerStyle={contentContainerStyle}
        renderHeader={renderHeader}
      />
    </BlurredBarsContentLayout>
  )
}
