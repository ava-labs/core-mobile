import { Image, SearchBar, Text, View } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ListRenderItem } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { PositionCard } from '../components/PositionCard'
import { MY_POSITIONS_MOCK } from '../mocks'
import { Position } from '../types'

const cactusIcon = require('../../../../assets/icons/cactus.png')

export const PerpetualsPositionsSearchScreen = (): JSX.Element => {
  const [searchText, setSearchText] = useState('')

  const results = useMemo(() => {
    const trimmed = searchText.trim().toLowerCase()
    if (trimmed.length === 0) {
      return []
    }
    return MY_POSITIONS_MOCK.filter(position =>
      position.symbol.toLowerCase().includes(trimmed)
    )
  }, [searchText])

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
        <PositionCard position={item} fullWidth expandable />
      </View>
    ),
    []
  )

  const keyExtractor = useCallback((item: Position) => item.id, [])

  const renderHeader = useCallback(
    () => (
      <SearchBar
        searchText={searchText}
        onTextChanged={setSearchText}
        useCancel
        autoFocus
        placeholder="Search"
      />
    ),
    [searchText]
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
        />
      )
    }
    return (
      <ErrorState
        icon={<Image source={cactusIcon} sx={{ width: 42, height: 42 }} />}
        title={'No results found'}
        description=""
      />
    )
  }, [searchText])

  return (
    <ListScreen
      title=""
      isModal
      data={results}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
      showNavigationHeaderTitle={false}
    />
  )
}
