import { Image, SearchBar, Text, View } from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreenV2 } from 'common/components/ListScreenV2'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { PositionCard } from '../components/PositionCard'
import { usePerpsPositionsView } from '../hooks/usePerpsPositionsView'
import { usePositionActions } from '../hooks/usePositionActions'
import { Position } from '../types'

const cactusIcon = require('../../../../assets/icons/cactus.png')

export const PerpetualsPositionsSearchScreen = (): JSX.Element => {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const positionActions = usePositionActions()
  const { positions } = usePerpsPositionsView()
  const results = useMemo(() => {
    const trimmed = searchText.trim().toLowerCase()
    if (trimmed.length === 0) {
      return []
    }
    return positions.filter(position =>
      position.symbol.toLowerCase().includes(trimmed)
    )
  }, [searchText, positions])

  useEffect(() => {
    const trimmed = searchText.trim()
    if (trimmed.length === 0) return
    const timer = setTimeout(() => {
      AnalyticsService.capture('PerpetualsPositionsSearched', {
        query: trimmed,
        resultCount: results.length
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [searchText, results.length])

  const renderItem: ListRenderItem<Position> = useCallback(
    ({ item }) => (
      <View sx={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <PositionCard
          position={item}
          fullWidth
          expandable
          onManage={() => positionActions.manage(item)}
          onMarketClose={() => positionActions.marketClose(item)}
          onLimitClose={() => positionActions.limitClose(item)}
        />
      </View>
    ),
    [positionActions]
  )

  const keyExtractor = useCallback((item: Position) => item.id, [])

  const handleCancel = useCallback(async () => {
    // Dismiss the keyboard before closing so it doesn't linger on Android.
    await dismissKeyboardIfNeeded()
    if (router.canGoBack()) {
      router.back()
    }
  }, [router])

  const renderHeader = useCallback(
    () => (
      <SearchBar
        searchText={searchText}
        onTextChanged={setSearchText}
        useCancel
        onCancel={handleCancel}
        autoFocus
        placeholder="Search"
      />
    ),
    [searchText, handleCancel]
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
          title={`Find your positions\nby name or symbol`}
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
      headerOutsideList
      data={results}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
      showNavigationHeaderTitle={false}
    />
  )
}
