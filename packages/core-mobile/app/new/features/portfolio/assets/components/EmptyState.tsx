import { GroupList, Icons, Text, useTheme } from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { useRouter } from 'expo-router'
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Platform, View, ViewStyle } from 'react-native'

import AVALANCHE_ANIMATION_DARK from 'assets/lotties/ava-logo-rotating-dark.json'
import AVALANCHE_ANIMATION_LIGHT from 'assets/lotties/ava-logo-rotating.json'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import LottieView from 'lottie-react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'

export const EmptyState = ({
  goToBuy
}: {
  goToBuy: () => void
}): JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()
  const header = useHeaderMeasurements()
  const headerHeight = useEffectiveHeaderHeight()
  const frame = useSafeAreaFrame()

  const animationContainerRef = useRef<View>(null)
  const [availableHeight, setAvailableHeight] = useState(0)

  const groupListData = useMemo(() => {
    const leftIconStyle: ViewStyle = {
      backgroundColor: colors.$borderPrimary,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center'
    }
    return [
      {
        title: 'Buy crypto',
        subtitle: `Buy tokens such as AVAX with a debit card or your bank account`,
        onPress: goToBuy,
        leftIcon: (
          <View style={leftIconStyle}>
            <Icons.Content.Add color={colors.$textPrimary} />
          </View>
        )
      },
      {
        title: 'Receive crypto',
        subtitle: 'Move funds from another wallet or exchange',
        onPress: () => router.navigate('/receive'),
        leftIcon: (
          <View style={leftIconStyle}>
            <Icons.Custom.Compare color={colors.$textPrimary} />
          </View>
        )
      }
    ]
  }, [colors.$borderPrimary, colors.$textPrimary, goToBuy, router])

  useLayoutEffect(() => {
    if (animationContainerRef.current) {
      animationContainerRef.current.measure(
        (...args: [number, number, number, number]) => {
          setAvailableHeight(args[3])
        }
      )
    }
  })

  const renderAnimation = useCallback(() => {
    if (availableHeight === 0) {
      return null
    }

    const aspectRatio = 240 / 210
    const scale = 1.3
    const height = availableHeight * scale
    const width = height * aspectRatio

    return (
      <View
        style={{
          position: 'absolute',
          zIndex: 1,
          bottom: 16,
          left: -75 * scale,
          width,
          height
        }}>
        <LottieView
          source={isDark ? AVALANCHE_ANIMATION_DARK : AVALANCHE_ANIMATION_LIGHT}
          autoPlay
          loop
          style={{
            width,
            height
          }}
        />
      </View>
    )
  }, [availableHeight, isDark])

  const containerStyle: ViewStyle = useMemo(() => {
    if (Platform.OS === 'android') {
      return {
        flex: 1,
        minHeight:
          frame.height -
          header.height -
          headerHeight -
          insets.bottom -
          insets.top -
          tabBarHeight -
          12,
        paddingTop: 14,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom
      }
    }

    return {
      minHeight: '100%',
      paddingHorizontal: 16,
      paddingBottom: insets.bottom + 32,
      paddingTop: 14,
      maxHeight: 450 + insets.bottom + 32
    }
  }, [
    frame.height,
    header.height,
    headerHeight,
    insets.bottom,
    insets.top,
    tabBarHeight
  ])

  return (
    <View style={containerStyle}>
      <View
        style={[
          {
            overflow: 'hidden',
            borderRadius: 12,
            flex: 1,
            backgroundColor: colors.$surfaceSecondary,
            paddingVertical: 16
          }
        ]}>
        <View
          ref={animationContainerRef}
          style={{
            flex: 1
          }}>
          {renderAnimation()}
        </View>
        <View
          style={{
            zIndex: 100,
            justifyContent: 'flex-end',
            gap: 8
          }}>
          <Text
            variant="heading3"
            sx={{ color: '$textPrimary', marginLeft: 16, width: '90%' }}>
            Get started by adding crypto to your wallet
          </Text>
          <GroupList
            data={groupListData}
            titleSx={{
              fontFamily: 'Inter-Medium',
              fontSize: 16
            }}
            subtitleSx={{
              maxWidth: 190,
              fontSize: 12,
              lineHeight: 15,
              fontFamily: 'Inter-Regular'
            }}
          />
        </View>
      </View>
    </View>
  )
}
