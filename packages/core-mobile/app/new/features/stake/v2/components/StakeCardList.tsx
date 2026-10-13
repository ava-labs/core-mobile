import { PChainTransaction, SortOrder } from '@avalabs/glacier-sdk'
import {
  AddCard,
  GRID_GAP,
  SCREEN_WIDTH,
  useMotion,
  useTheme
} from '@avalabs/k2-alpine'
import { useIsFocused } from 'expo-router'
import {
  FlashList,
  FlashListRef,
  ListRenderItemInfo
} from '@shopify/flash-list'
import { LoadingState } from 'common/components/LoadingState'
import { useRouter } from 'expo-router'
import { useStakes } from 'hooks/earn/useStakes'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AppState,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  ViewStyle
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useAddStake } from '../../hooks/useAddStake'
import { useStakeFilterAndSort } from '../../hooks/useStakeFilterAndSort'
import { useStakeCardRenderer } from '../hooks/useStakeCardRenderer'
import { BASE_CARD_HEIGHT } from './StakeCard'

export interface StakeCardListHeaderProps {
  isEmpty: boolean
  filter: ReturnType<typeof useStakeFilterAndSort>['filter']
  sort: ReturnType<typeof useStakeFilterAndSort>['sort']
}

export interface StakeCardListProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent> | number) => void
  containerStyle?: StyleProp<ViewStyle>
  isActive?: boolean
  renderHeader: (props: StakeCardListHeaderProps) => JSX.Element
}

export const StakeCardList = ({
  onScroll,
  containerStyle,
  isActive = true,
  renderHeader
}: StakeCardListProps): JSX.Element => {
  const { navigate } = useRouter()
  const [appState, setAppState] = useState(AppState.currentState)
  const isFocused = useIsFocused()
  const isMotionActive = useMemo(
    () =>
      appState === 'active' && isFocused && Platform.OS === 'ios' && isActive,
    [appState, isFocused, isActive]
  )
  const motion = useMotion(isMotionActive)

  const [selectedSort, setSelectedSort] = useState<SortOrder>(SortOrder.DESC)
  const {
    data: _data,
    isRefreshing,
    pullToRefresh: onRefresh,
    isLoading
  } = useStakes(selectedSort)
  const stakes = useMemo(() => _data ?? [], [_data])
  const { theme } = useTheme()

  const isEmpty = stakes.length === 0

  const {
    data: filteredStakes,
    filter,
    sort
  } = useStakeFilterAndSort({
    stakes,
    // Web parity: the V2 home screen's chip row includes the stake-type
    // filters (Fast stakes / Delegation) after the status ones.
    includeTypeFilters: true
  })

  const data: StakeCardType[] = useMemo(
    () => [StaticCard.Add, ...filteredStakes],
    [filteredStakes]
  )

  const { addStake, canAddStake } = useAddStake()
  const scrollOffsetRef = useRef({ x: 0, y: 0 })

  const handlePressStake = useCallback(
    (txHash: string) => {
      // `source` feeds StakeDetailViewed's entry-point attribution.
      navigate({ pathname: '/stakeDetail', params: { txHash, source: 'home' } })
    },
    [navigate]
  )

  // Single time snapshot shared across all cards in this render. We don't
  // tick this live — users typically don't keep the home screen open long
  // enough for the small drift in "Locked until" / progress to matter.
  const now = useMemo(() => new Date(), [])

  const renderStake = useStakeCardRenderer({
    now,
    motion,
    width: CARD_WIDTH,
    onPressStake: handlePressStake
  })

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<StakeCardType>): JSX.Element | null => {
      let content: JSX.Element | null = null
      if (item === StaticCard.Add) {
        content = (
          <AddCard
            width={CARD_WIDTH}
            height={BASE_CARD_HEIGHT}
            onPress={addStake}
            disabled={!canAddStake}
          />
        )
      } else {
        content = renderStake(item)
      }

      if (!content) return null

      return (
        <Animated.View
          style={{
            marginBottom: 14,
            marginHorizontal: GRID_GAP / 2
          }}>
          {content}
        </Animated.View>
      )
    },
    [canAddStake, addStake, renderStake]
  )

  // Outer edge from screen: paddingHorizontal (9) + item marginHorizontal (7) = 16.
  // Inner gap between the two columns: 2 * item marginHorizontal (7) = GRID_GAP (14).
  const overrideProps = {
    contentContainerStyle: [
      { paddingHorizontal: 16 - GRID_GAP / 2 },
      containerStyle
    ]
  }

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset
      onScroll?.(event)
    },
    [onScroll]
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    if (scrollOffsetRef.current && isActive && onScroll) {
      // Sync scroll position when tab becomes active
      onScroll(scrollOffsetRef.current.y)
    }
  }, [isActive, onScroll])

  useEffect(() => {
    setSelectedSort(sort.selected as SortOrder)
  }, [sort.selected])

  // Changing the filter/sort selection remounts the FlashList (see the `key`
  // below), which resets the native scroll offset to 0 WITHOUT emitting a
  // scroll event. Two problems fall out of that: the scroll position is lost
  // even when the new selection has plenty of content, and scroll-driven
  // header state (the fading navigation title on the stake home) stays stuck
  // at the pre-remount offset. So on every remount we restore the previous
  // offset — clamped to the fresh list's scrollable range, so a selection
  // with less content lands as far down as it can (the top, when it doesn't
  // scroll at all) — and re-sync the header to wherever we actually landed.
  //
  // The remount is detected during render (ref compare, not an effect dep
  // list): `onScroll`'s identity is not guaranteed stable across parent
  // re-renders, and restoring outside an actual remount would fight the
  // user's live scrolling.
  const listRef = useRef<FlashListRef<StakeCardType>>(null)
  const listLayoutHeightRef = useRef(0)
  const pendingRestoreOffsetRef = useRef<number | null>(null)
  const listRemountKey = `${filter.selected}-${sort.selected}`
  const prevListRemountKeyRef = useRef(listRemountKey)
  if (prevListRemountKeyRef.current !== listRemountKey) {
    prevListRemountKeyRef.current = listRemountKey
    pendingRestoreOffsetRef.current = scrollOffsetRef.current.y
  }

  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    listLayoutHeightRef.current = event.nativeEvent.layout.height
  }, [])

  // Fires once the freshly mounted list has measured its content — the
  // earliest point where the scrollable range (and thus the clamp) is known.
  // Restores are one-shot; ordinary content-size changes (background stake
  // refreshes) leave the user's position alone.
  const handleContentSizeChange = useCallback(
    (_width: number, height: number): void => {
      const target = pendingRestoreOffsetRef.current
      if (target === null) return
      pendingRestoreOffsetRef.current = null
      if (target === 0) return
      const maxOffset = Math.max(0, height - listLayoutHeightRef.current)
      const clamped = Math.min(target, maxOffset)
      listRef.current?.scrollToOffset({ offset: clamped, animated: false })
      // Sync the shared header state ourselves — the imperative scroll isn't
      // guaranteed to emit a scroll event (notably when clamped to 0).
      scrollOffsetRef.current = { x: 0, y: clamped }
      onScroll?.(clamped)
    },
    [onScroll]
  )

  // Pass the header as a JSX element rather than a component reference.
  // FlashList instantiates a function passed to `ListHeaderComponent` as
  // `<HeaderComponent />`, so a new function identity (which happens every
  // time `filter`/`sort` change here) reads as a new component *type* and
  // unmounts/remounts the entire header subtree — including <Banner />,
  // which retriggers the CircularProgress mount animation. Reconciling by
  // element type instead keeps the Banner instance alive across filter
  // changes.
  const headerElement = useMemo(
    () => renderHeader({ isEmpty, filter, sort }),
    [renderHeader, isEmpty, filter, sort]
  )

  if (isLoading) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return (
    <FlashList
      // Remount the masonry grid when the filter/sort selection changes. On
      // Fabric, FlashList's masonry layout manager retains stale column heights
      // across an in-place `data` reorder, so cells keep their previous column
      // positions and the inter-card gaps break. Keying by the active selection
      // gives each ordering a fresh layout pass (matches the v1 StakeCardList
      // and StakeSearchScreen approach). It stays stable per selection so it
      // doesn't thrash on background stake refreshes.
      key={`stake-card-list-${listRemountKey}`}
      ref={listRef}
      onLayout={handleLayout}
      onContentSizeChange={handleContentSizeChange}
      onScroll={handleScroll}
      overrideProps={overrideProps}
      data={data}
      numColumns={2}
      masonry
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyExtractor={(item, index) =>
        item === StaticCard.Add
          ? 'add-card'
          : (item as PChainTransaction).txHash ?? index.toString()
      }
      removeClippedSubviews={true}
      extraData={{ isDark: theme.isDark, motion }}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      ListHeaderComponent={headerElement}
      // Negative margin cancels the contentContainer's paddingHorizontal for
      // the header, so its existing paddingHorizontal: 16 still aligns to the
      // screen edge instead of being indented by the column padding.
      ListHeaderComponentStyle={{ marginHorizontal: -(16 - GRID_GAP / 2) }}
    />
  )
}

enum StaticCard {
  Add = 'Add'
}
type StakeCardType = StaticCard | PChainTransaction
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)
