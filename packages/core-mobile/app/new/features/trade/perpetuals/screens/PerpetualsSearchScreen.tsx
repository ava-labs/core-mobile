import {
  Chip,
  Image,
  PriceChangeStatus,
  SearchBar,
  Text,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { DropdownGroup, DropdownMenu } from 'common/components/DropdownMenu'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreenV2 } from 'common/components/ListScreenV2'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { PerpetualListItem } from '../components/PerpetualListItem'
import { usePerpetualMarkets } from '../hooks/usePerpetualMarkets'
import { usePerpsLiveMidsFeed } from '../hooks/usePerpsLiveMids'
import { PerpMarketView } from '../types'

const cactusIcon = require('../../../../assets/icons/cactus.png')

type PerpetualSort = 'volume' | 'change' | 'price'

const SORT_OPTIONS: { id: PerpetualSort; title: string }[] = [
  { id: 'volume', title: 'Volume' },
  { id: 'change', title: 'Change' },
  { id: 'price', title: 'Price' }
]

// Signed % change so a Down status sorts below a flat/Up one — mirrors the
// ordering used by the main PerpetualsScreen filter.
const signedChange = (market: PerpMarketView): number =>
  market.changeStatus === PriceChangeStatus.Down
    ? -market.changePercent
    : market.changeStatus === PriceChangeStatus.Up
    ? market.changePercent
    : 0

export const PerpetualsSearchScreen = (): JSX.Element => {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const [isSearchBarFocused, setIsSearchBarFocused] = useState(false)
  const [selectedSort, setSelectedSort] = useState<PerpetualSort>('volume')

  const { markets } = usePerpetualMarkets()

  // Keep search-result prices live too.
  usePerpsLiveMidsFeed()

  const results = useMemo(() => {
    const trimmed = searchText.trim().toLowerCase()
    if (trimmed.length === 0) {
      return []
    }
    const filtered = markets.filter(market =>
      market.symbol.toLowerCase().includes(trimmed)
    )
    switch (selectedSort) {
      case 'volume':
        return [...filtered].sort((a, b) => b.volume - a.volume)
      case 'change':
        return [...filtered].sort((a, b) => signedChange(b) - signedChange(a))
      case 'price':
        return [...filtered].sort((a, b) => b.price - a.price)
      default:
        return filtered
    }
  }, [searchText, selectedSort, markets])

  const sortGroups = useMemo<DropdownGroup[]>(
    () => [
      {
        key: 'perp-search-sort',
        items: SORT_OPTIONS.map(option => ({
          id: option.id,
          title: option.title,
          selected: option.id === selectedSort
        }))
      }
    ],
    [selectedSort]
  )

  const handleSortChange = useCallback(
    (event: { nativeEvent: { event: string } }) => {
      const sort = SORT_OPTIONS.find(
        option => option.id === event.nativeEvent.event
      )
      if (sort) {
        setSelectedSort(sort.id)
      }
    },
    []
  )

  const handleMarketPress = useCallback(
    (symbol: string) => {
      router.navigate(`/perpetualsDetails?coin=${encodeURIComponent(symbol)}`)
    },
    [router]
  )

  const renderItem: ListRenderItem<PerpMarketView> = useCallback(
    ({ item, index }) => (
      <PerpetualListItem
        market={item}
        isFirst={index === 0}
        onPress={handleMarketPress}
      />
    ),
    [handleMarketPress]
  )

  const keyExtractor = useCallback((item: PerpMarketView) => item.id, [])

  const handleCancel = useCallback(async () => {
    // Dismiss the keyboard before closing so it doesn't linger on Android.
    await dismissKeyboardIfNeeded()
    if (router.canGoBack()) {
      router.back()
    }
  }, [router])

  const renderHeader = useCallback(
    () => (
      <View sx={{ gap: 12 }}>
        <SearchBar
          searchText={searchText}
          onTextChanged={setSearchText}
          setSearchBarFocused={setIsSearchBarFocused}
          useCancel
          onCancel={handleCancel}
          autoFocus
          placeholder="Search"
        />
        {results.length > 0 && (
          <DropdownMenu groups={sortGroups} onPressAction={handleSortChange}>
            <Chip
              size="large"
              hitSlop={8}
              rightIcon="expandMore"
              style={{ alignSelf: 'flex-start' }}>
              Sort
            </Chip>
          </DropdownMenu>
        )}
      </View>
    ),
    [searchText, results.length, sortGroups, handleSortChange, handleCancel]
  )

  const renderEmpty = useCallback(() => {
    const isZero = searchText.trim().length === 0
    if (isZero) {
      return (
        <ErrorState
          icon={
            <Text variant="heading2" sx={{ fontSize: 42, lineHeight: 50 }}>
              🔍
            </Text>
          }
          title={`Find perps\nby name or symbol`}
          description=""
          sx={{ flex: 1 }}
        />
      )
    }

    return (
      <ErrorState
        icon={<Image source={cactusIcon} sx={{ width: 42, height: 42 }} />}
        title={'No results found'}
        description=""
        sx={{ flex: 1 }}
      />
    )
  }, [searchText])

  return (
    <ListScreenV2
      title=""
      isModal
      // Android: render the search header outside the list and mount the list
      // only when there are results, so the form sheet wires swipe-to-dismiss /
      // nested scroll to a non-empty list. No-op on iOS (CP-14376).
      headerOutsideList
      data={results}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
      showNavigationHeaderTitle={false}
      extraData={{ isSearchBarFocused }}
    />
  )
}
