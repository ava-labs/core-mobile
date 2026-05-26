import {
  alpha,
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { TouchableOpacity } from 'react-native'
import { Position } from '../types'
import { PositionCard } from './PositionCard'

interface PositionsProps {
  positions: Position[]
}

export const Positions = ({
  positions
}: PositionsProps): JSX.Element | null => {
  const { theme } = useTheme()
  const router = useRouter()

  const keyExtractor = useCallback((item: Position) => item.id, [])

  const handlePositionsPress = useCallback(() => {
    router.navigate('/perpetualsPositions')
  }, [router])

  const renderItem: ListRenderItem<Position> = useCallback(
    ({ item, index }) => (
      <AnimatedPressable
        onPress={handlePositionsPress}
        style={{ marginRight: index === positions.length - 1 ? 0 : 12 }}>
        <PositionCard position={item} />
      </AnimatedPressable>
    ),
    [handlePositionsPress, positions.length]
  )

  if (positions.length === 0) {
    return null
  }

  return (
    <View sx={{ gap: 8 }}>
      <TouchableOpacity
        onPress={handlePositionsPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16
        }}>
        <Text variant="heading3">My positions</Text>
        <Icons.Navigation.ChevronRight
          color={alpha(theme.colors.$textPrimary, 0.4)}
        />
      </TouchableOpacity>
      <FlashList
        horizontal
        data={positions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  )
}
