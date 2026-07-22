import { Chip, View } from '@avalabs/k2-alpine'
import React, { useCallback, useState } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { PerpsCategoryChip } from '../hooks/usePerpsMarketFilters'
import { CategoryId } from '../utils/marketCategories'

/**
 * Horizontal row of category chips shown below the sort chips. Leads with an
 * "All" chip (no category filter); the rest come from the markets actually
 * present. Mirrors the category carousel on core-web.
 */
export const PerpsCategoryChips = ({
  categories,
  selectedCategory,
  onSelectCategory,
  scrollOffsetRef
}: {
  categories: PerpsCategoryChip[]
  selectedCategory: CategoryId | undefined
  onSelectCategory: (category: CategoryId | undefined) => void
  /**
   * Parent-owned ref that persists the horizontal scroll offset across
   * remounts. Changing the category re-filters the list, which unmounts and
   * remounts the surrounding header — without this the row would snap back to
   * the left. Pass a stable `useRef(0)`.
   */
  scrollOffsetRef?: React.MutableRefObject<number>
}): JSX.Element | null => {
  // Capture the initial offset once so re-renders don't re-apply contentOffset.
  const [initialScrollX] = useState(() => scrollOffsetRef?.current ?? 0)

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
      if (scrollOffsetRef) {
        scrollOffsetRef.current = e.nativeEvent.contentOffset.x
      }
    },
    [scrollOffsetRef]
  )

  if (categories.length === 0) {
    return null
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentOffset={{ x: initialScrollX, y: 0 }}
      contentContainerStyle={{
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 12
      }}>
      <Chip
        size="large"
        isSelected={selectedCategory === undefined}
        onPress={() => onSelectCategory(undefined)}>
        All
      </Chip>
      {categories.map(({ id, label }) => (
        <View key={id}>
          <Chip
            size="large"
            isSelected={selectedCategory === id}
            onPress={() => onSelectCategory(id)}>
            {label}
          </Chip>
        </View>
      ))}
    </ScrollView>
  )
}
