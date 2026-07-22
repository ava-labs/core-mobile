import {
  alpha,
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React, { useCallback, useRef, useState } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { usePerpsPositionsView } from '../hooks/usePerpsPositionsView'
import { PositionCard } from './PositionCard'

interface PositionsProps {
  /**
   * Optional parent-owned ref that persists the horizontal scroll offset
   * across remounts of `Positions`. Pass a stable `useRef(0)` from the
   * parent screen so the carousel position survives header re-renders
   * triggered by filter / sort changes on the surrounding list.
   */
  scrollOffsetRef?: React.RefObject<number>
}

export const Positions = ({
  scrollOffsetRef
}: PositionsProps): JSX.Element | null => {
  const { theme } = useTheme()
  const router = useRouter()

  const { positions, isLoading } = usePerpsPositionsView()

  const [initialScrollX] = useState(() => scrollOffsetRef?.current ?? 0)

  // Once we've shown a full set, never blank out again: on reload we keep the
  // current positions on screen and let them update in place (stale-while-
  // revalidate). Only the very first load waits for both dexes (below).
  const hasShownRef = useRef(false)

  const handlePositionsPress = useCallback(() => {
    router.navigate('/perpetualsPositions')
  }, [router])

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (scrollOffsetRef) {
        scrollOffsetRef.current = e.nativeEvent.contentOffset.x
      }
    },
    [scrollOffsetRef]
  )

  // Nothing to show (empty account, or the very first bytes haven't landed).
  if (positions.length === 0) {
    return null
  }
  // First load only: hold until BOTH the main-dex and HIP-3 feeds have
  // responded, so positions reveal as one complete set rather than main-dex
  // cards showing first and HIP-3 ones popping in a moment later. After we've
  // shown a full set once, `hasShownRef` keeps the carousel visible through any
  // reload — stale positions stay on screen and update in place when the fresh
  // data arrives, instead of blanking out mid-refresh.
  if (isLoading && !hasShownRef.current) {
    return null
  }
  hasShownRef.current = true

  return (
    <View sx={{ gap: 8 }}>
      <TouchableOpacity
        onPress={handlePositionsPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          alignSelf: 'flex-start'
        }}>
        <Text variant="heading3">My positions</Text>
        <Icons.Navigation.ChevronRight
          color={alpha(theme.colors.$textPrimary, 0.4)}
        />
      </TouchableOpacity>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: initialScrollX, y: 0 }}>
        {positions.map((position, index) => (
          <AnimatedPressable
            key={position.id}
            onPress={handlePositionsPress}
            style={{ marginRight: index === positions.length - 1 ? 0 : 12 }}>
            <PositionCard position={position} />
          </AnimatedPressable>
        ))}
      </ScrollView>
    </View>
  )
}
