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
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView as RNScrollView
} from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { StuckFundsBanner } from 'features/swap/components/StuckFundsBanner'
import AnalyticsService from 'services/analytics/AnalyticsService'
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

  // Focus (not mount): tab screens stay mounted across tab switches, so a
  // mount effect would count only the first visit per session. Firing on
  // focus matches the legacy `StakeOpened` tab-press semantics (and the
  // `EarnOpened` pattern on the Earn home).
  useFocusEffect(
    useCallback(() => {
      AnalyticsService.capture('StakeHomeViewed')
    }, [])
  )

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

  // Selecting a chip changes the list's filter, and `StakeCardList` keys its
  // FlashList by the active selection (a Fabric masonry workaround), so the
  // whole header — this chip ScrollView included — remounts and would snap
  // back to x=0. Track the offset across remounts and restore it once the
  // fresh ScrollView has measured its content.
  const chipScrollRef = useRef<RNScrollView>(null)
  const chipScrollOffsetX = useRef(0)
  const handleChipScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      chipScrollOffsetX.current = event.nativeEvent.contentOffset.x
    },
    []
  )
  const restoreChipScroll = useCallback(() => {
    if (chipScrollOffsetX.current > 0) {
      chipScrollRef.current?.scrollTo({
        x: chipScrollOffsetX.current,
        animated: false
      })
    }
  }, [])

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
            <>
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
                    ref={chipScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleChipScroll}
                    scrollEventThrottle={16}
                    onContentSizeChange={restoreChipScroll}
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
              {/* CCT banner — points stakers to Swap for P→C transfers.
                  Self-hides (and reserves no space) when dismissed or nothing
                  is claimable. */}
              <CctBanner sx={{ marginTop: 16, marginHorizontal: 16 }} />
            </>
          )}
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
      handleSearchPress,
      handleChipScroll,
      restoreChipScroll
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
