import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { Text, useTheme, View } from '@avalabs/k2-alpine'
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  ListRenderItemInfo
} from 'react-native'

// ─── Constants ────────────────────────────────────────────────────────────────

export const DRUM_ITEM_HEIGHT = 48
export const DRUM_VISIBLE_ITEMS = 5
export const DRUM_PICKER_HEIGHT = DRUM_ITEM_HEIGHT * DRUM_VISIBLE_ITEMS

// ─── DrumColumn ───────────────────────────────────────────────────────────────

export interface DrumColumnProps {
  items: string[]
  selectedIndex: number
  onIndexChange: (index: number) => void
}

/**
 * A single scrollable drum-roll column.
 * Uses FlatList with snapToInterval so each gesture snaps to an item boundary.
 * The selected item is centred in the DRUM_PICKER_HEIGHT window.
 */
export function DrumColumn({
  items,
  selectedIndex,
  onIndexChange
}: DrumColumnProps): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const listRef = useRef<FlatList<string>>(null)

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y
      const index = Math.round(offsetY / DRUM_ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(index, items.length - 1))
      onIndexChange(clamped)
    },
    [items.length, onIndexChange]
  )

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<string>) => {
      const isSelected = index === selectedIndex
      return (
        <View
          style={styles.drumItem}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            height: DRUM_ITEM_HEIGHT
          }}>
          <Text
            sx={{
              fontSize: isSelected ? 20 : 16,
              fontWeight: isSelected ? '600' : '400',
              color: isSelected ? colors.$textPrimary : colors.$textSecondary,
              lineHeight: DRUM_ITEM_HEIGHT
            }}>
            {item}
          </Text>
        </View>
      )
    },
    [selectedIndex, colors]
  )

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: DRUM_ITEM_HEIGHT,
      offset: DRUM_ITEM_HEIGHT * index,
      index
    }),
    []
  )

  const snapOffsets = useMemo(
    () => items.map((_, i) => i * DRUM_ITEM_HEIGHT),
    [items]
  )

  // Scroll to the current selectedIndex synchronously after every layout so
  // there is no one-frame flash of misaligned content when the selection changes.
  useLayoutEffect(() => {
    listRef.current?.scrollToOffset({
      offset: selectedIndex * DRUM_ITEM_HEIGHT,
      animated: false
    })
  }, [selectedIndex])

  return (
    <View
      style={{ height: DRUM_PICKER_HEIGHT, overflow: 'hidden' }}
      sx={{ flex: 1 }}>
      {/* Selection highlight band */}
      <View
        pointerEvents="none"
        style={[
          styles.selectionBand,
          {
            top: DRUM_ITEM_HEIGHT * Math.floor(DRUM_VISIBLE_ITEMS / 2),
            backgroundColor: colors.$surfaceSecondary
          }
        ]}
      />
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{
          paddingTop: DRUM_ITEM_HEIGHT * Math.floor(DRUM_VISIBLE_ITEMS / 2),
          paddingBottom: DRUM_ITEM_HEIGHT * Math.floor(DRUM_VISIBLE_ITEMS / 2)
        }}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  drumItem: {
    height: DRUM_ITEM_HEIGHT
  },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: DRUM_ITEM_HEIGHT,
    borderRadius: 8,
    zIndex: 0
  }
})
