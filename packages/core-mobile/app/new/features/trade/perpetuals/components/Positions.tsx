import {
  alpha,
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import React, { useCallback } from 'react'
import { TouchableOpacity } from 'react-native'
import { Position } from '../types'
import { PositionCard } from './PositionCard'

interface PositionsProps {
  positions: Position[]
  onPositionPress?: (position: Position) => void
  onTitlePress?: () => void
  title?: string
}

export const Positions = ({
  positions,
  onPositionPress,
  onTitlePress,
  title = 'My positions'
}: PositionsProps): JSX.Element | null => {
  const { theme } = useTheme()

  const keyExtractor = useCallback((item: Position) => item.id, [])

  const renderItem: ListRenderItem<Position> = useCallback(
    ({ item, index }) => (
      <AnimatedPressable
        onPress={() => onPositionPress?.(item)}
        style={{ marginRight: index === positions.length - 1 ? 0 : 12 }}>
        <PositionCard position={item} />
      </AnimatedPressable>
    ),
    [onPositionPress, positions.length]
  )

  if (positions.length === 0) {
    return null
  }

  return (
    <View sx={{ gap: 8 }}>
      <TouchableOpacity
        onPress={onTitlePress}
        disabled={onTitlePress === undefined}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16
        }}>
        <Text variant="heading3">{title}</Text>
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
