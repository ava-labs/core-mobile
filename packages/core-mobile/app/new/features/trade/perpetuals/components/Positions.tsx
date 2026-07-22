import {
  alpha,
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
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

  const { positions } = usePerpsPositionsView()

  const [initialScrollX] = useState(() => scrollOffsetRef?.current ?? 0)

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
