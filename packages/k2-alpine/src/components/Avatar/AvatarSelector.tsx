import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { ImageSourcePropType, ListRenderItem, Platform } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { SvgProps } from 'react-native-svg'
import { isScreenSmall } from '../../utils'
import { AnimatedPressable } from '../Animated/AnimatedPressable'
import { View } from '../Primitives'
import { Avatar } from './Avatar'

export const AvatarSelector = ({
  avatars,
  selectedId,
  onSelect
}: {
  avatars: { id: string; source: ImageSourcePropType | React.FC<SvgProps> }[]
  selectedId?: string
  onSelect?: (id: string) => void
}): JSX.Element => {
  const avatarWidth = isScreenSmall
    ? configuration.avatarWidth.small
    : configuration.avatarWidth.large

  const flatListRef = useRef<FlatList>(null)
  const hasScrolledToSelected = useRef(false)

  const handleSelect = useCallback(
    (index: number): void => {
      const id = avatars[index]?.id
      if (id) {
        onSelect?.(id)
      }
    },
    [avatars, onSelect]
  )

  const gap = useMemo(
    () => avatarWidth / 2 - configuration.spacing / 2,
    [avatarWidth]
  )

  const renderItem: ListRenderItem<{
    id: string
    source: ImageSourcePropType | React.FC<SvgProps>
  }> = useCallback(
    ({
      item,
      index
    }: {
      item: { id: string; source: ImageSourcePropType | React.FC<SvgProps> }
      index: number
    }): JSX.Element => {
      const isSelected = item?.id === selectedId

      return (
        <View
          style={{
            width: avatarWidth,
            height: avatarWidth,
            marginRight: -gap / 2,
            marginLeft: -gap / 2,
            zIndex: index % 2 === 0 ? 0 : 1
          }}>
          <AnimatedPressable
            onPress={() => handleSelect(index)}
            style={{
              top: index % 2 === 0 ? avatarWidth : configuration.spacing,
              position: 'absolute'
            }}>
            <Avatar
              source={item?.source}
              size={avatarWidth}
              isSelected={isSelected}
            />
          </AnimatedPressable>
        </View>
      )
    },
    [avatarWidth, handleSelect, gap, selectedId]
  )

  const contentOffset = useMemo(() => {
    return {
      x:
        (avatars.length * gap -
          avatarWidth +
          (Platform.OS === 'ios' ? (isScreenSmall ? 6 : 26) : 22)) /
        2,
      y: 0
    }
  }, [avatarWidth, avatars.length, gap])

  // Scroll to selected avatar after initial render
  useEffect(() => {
    if (selectedId && !hasScrolledToSelected.current && flatListRef.current) {
      const selectedIndex = avatars.findIndex(
        avatar => avatar.id === selectedId
      )
      if (selectedIndex >= 0) {
        // Small delay to ensure FlatList is fully mounted and items are rendered
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: selectedIndex,
            animated: true,
            viewPosition: 0.5
          })
          hasScrolledToSelected.current = true
        }, 100)
      }
    }
  }, [selectedId, avatars])

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      // If scroll to index fails, wait and try again
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        })
      }, 100)
    },
    []
  )

  return (
    <FlatList
      ref={flatListRef}
      data={avatars}
      horizontal
      showsHorizontalScrollIndicator={false}
      renderItem={renderItem}
      windowSize={7}
      contentOffset={contentOffset}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      updateCellsBatchingPeriod={50}
      keyExtractor={item => item.id}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      contentContainerStyle={{
        paddingHorizontal: gap - configuration.spacing * 2
      }}
      style={{
        height: avatarWidth * 2
      }}
    />
  )
}

const configuration = {
  avatarWidth: {
    large: 90,
    small: 60
  },
  spacing: 6
}
