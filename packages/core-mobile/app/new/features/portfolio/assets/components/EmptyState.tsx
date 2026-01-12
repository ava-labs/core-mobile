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

import { useHeaderHeight } from '@react-navigation/elements'
import AVALANCHE_ANIMATION from 'assets/lotties/ava-logo-rotating.json'
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
    theme: { colors }
  } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()
  const header = useHeaderMeasurements()
  const headerHeight = useHeaderHeight()
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
        // @ts-ignore TODO: make routes typesafe
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
        (x: number, y: number, width: number, height: number) => {
          setAvailableHeight(height)
        }
      )
    }
  })

  const renderAnimation = useCallback(() => {
    if (availableHeight === 0) {
      return null
    }

    const aspectRatio = 240 / 210
    const scale = 1.2
    const height = availableHeight * scale
    const width = height * aspectRatio
    const top = -46 * scale
    const left = -35 * scale

    return (
      <View
        style={{
          position: 'absolute',
          zIndex: 1,
          top,
          left,
          width,
          height
        }}>
        <LottieView
          source={AVALANCHE_ANIMATION}
          autoPlay
          loop
          style={{
            width,
            height
          }}
        />
      </View>
    )
  }, [availableHeight])

  const containerStyle: ViewStyle = useMemo(() => {
    if (Platform.OS === 'android') {
      return {
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
        {renderAnimation()}
        <View
          ref={animationContainerRef}
          style={{
            flex: 1
          }}
        />
        <View
          style={{
            zIndex: 100,
            justifyContent: 'flex-end',
            gap: 8
          }}>
          <Text
            variant="heading3"
            sx={{ color: '$textPrimary', marginLeft: 16, width: '65%' }}>
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
