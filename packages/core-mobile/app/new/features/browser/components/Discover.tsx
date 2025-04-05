import {
  alpha,
  AnimatedPressable,
  Button,
  ScrollView,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import React, { ReactNode } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, AddHistoryPayload } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { BROWSER_CONTROLS_HEIGHT, HORIZONTAL_MARGIN } from '../consts'
import { prepareFaviconToLoad } from '../utils'
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
        paddingTop: insets.top + 26,
        paddingBottom: BROWSER_CONTROLS_HEIGHT + tabBarHeight
      }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: -insets.top,
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

      <DApps />

      <View
        style={{
          gap: 12
        }}>
        <View style={{ paddingHorizontal: HORIZONTAL_MARGIN }}>
          <Text variant="heading3">Learn</Text>
        </View>
        <Learn />
      </View>

      {/* TODO: will be added in the future */}
      {/* <View>
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
          <TopProjects />
        </View> */}
    </ScrollView>
  )
}

const Learn = (): ReactNode => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()

  const handlePress = (item: AddHistoryPayload): void => {
    AnalyticsService.capture('BrowserDiscoverLearnTapped', {
      url: item.url
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.title,
        url: item.url
      })
    )
    handleUrlSubmit?.(item.url)
  }

  const renderItem: ListRenderItem<AddHistoryPayload> = ({ item }) => {
    return (
      <AnimatedPressable
        style={{
          borderRadius: 18,
          backgroundColor: theme.isDark ? '#484848' : '#F2F2F3',
          padding: 22,
          gap: 14,
          borderColor: theme.colors.$borderPrimary,
          borderWidth: 1
        }}
        onPress={() => handlePress(item)}>
        <View
          style={{
            gap: 8
          }}>
          <Text variant="heading6">{item.title}</Text>
          <Text
            variant="subtitle2"
            style={{
              color: theme.colors.$textSecondary
            }}>
            {item.description}
          </Text>
        </View>

        <Button
          style={{
            alignSelf: 'flex-start',
            width: 72
          }}
          size="small"
          type="secondary"
          onPress={() => handlePress(item)}>
          Read
        </Button>
      </AnimatedPressable>
    )
  }
  return (
    <View>
      <FlatList
        data={LEARN_CARDS}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_MARGIN,
          paddingBottom: 36,
          gap: 12
        }}
      />
    </View>
  )
}

const DApps = (): ReactNode => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()

  const handlePress = (item: AddHistoryPayload): void => {
    AnalyticsService.capture('BrowserDiscoverDAppTapped', {
      url: item.url
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.title,
        url: item.url,
        favicon: '/favicon.ico'
      })
    )
    handleUrlSubmit?.(item.url)
  }

  const renderItem: ListRenderItem<AddHistoryPayload> = ({ item }) => {
    return (
      <AnimatedPressable
        style={{
          width: 240,
          height: 300,
          borderRadius: 18,
          backgroundColor: theme.isDark ? '#484848' : '#F2F2F3',
          padding: 22,
          gap: 8,
          borderColor: theme.colors.$borderPrimary,
          borderWidth: 1,
          overflow: 'hidden'
        }}
        onPress={() => handlePress(item)}>
        <BlurView
          tint={theme.isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1
          }}>
          <View
            style={{
              position: 'absolute',
              bottom: -12,
              left: 22
            }}>
            <Image
              source={prepareFaviconToLoad(item.url, item.favicon)}
              style={{ width: 150, height: 150, borderRadius: 100 }}
            />
          </View>
        </BlurView>

        <View style={{ zIndex: 10, gap: 8 }}>
          <Text variant="heading3">{item.title}</Text>
          <Text variant="subtitle1">{item.description}</Text>
        </View>

        <View
          style={{
            position: 'absolute',
            zIndex: -1,
            bottom: -72,
            left: -38,
            opacity: 0.15
          }}>
          <Image
            source={prepareFaviconToLoad(item.url, item.favicon)}
            style={{
              width: 270,
              height: 270,
              borderRadius: 270
            }}
          />
        </View>
      </AnimatedPressable>
    )
  }
  return (
    <View>
      <FlatList
        data={DISCOVER_CARDS}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_MARGIN,
          paddingVertical: 36,
          gap: HORIZONTAL_MARGIN
        }}
        horizontal
      />
    </View>
  )
}

const DISCOVER_CARDS: AddHistoryPayload[] = [
  {
    title: 'Enclave Markets',
    description:
      'The world’s first fully encrypted exchange (FEX). Lorem ipsum dolor sit amet',
    favicon: '/favicon.ico',
    url: 'https://www.enclave.market'
  },
  {
    title: 'Beam',
    description:
      'Beam offers a powerful, flexible solution lorem ipsum dolor sit amet lorem ipsum dolor',
    favicon: '/favicon.ico',
    url: 'https://onbeam.com'
  }
]

const LEARN_CARDS: AddHistoryPayload[] = [
  {
    title: 'Crypto on the go with the Core mobile app',
    description:
      'Official resources for Core mobile. The fastest, most intuitive wallet for connecting to the rapidly-growing DeFi, NFT, and gaming ecosystems across Avalanche',
    url: 'https://www.enclave.market'
  },
  {
    title: 'How do I use the Airdrop tool?',
    description:
      'Airdrop tool is a self-serve user-friendly promotions and airdrop tool to allow users to seamlessly distribute tokens by leveraging the underlying data sources managed and developed by Ava Labs',
    url: 'https://onbeam.com'
  }
]
