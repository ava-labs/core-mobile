import { Image, SearchBar, Text } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { ListRenderItem } from 'react-native'
import { PerpetualListItem } from '../components/PerpetualListItem'
import { PERP_MARKETS_MOCK } from '../mocks'
import { PerpetualMarket } from '../types'

const cactusIcon = require('../../../../assets/icons/cactus.png')

export const PerpetualsSearchScreen = (): JSX.Element => {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const [isSearchBarFocused, setIsSearchBarFocused] = useState(false)

  const results = useMemo(() => {
    const trimmed = searchText.trim().toLowerCase()
    if (trimmed.length === 0) {
      return []
    }
    return PERP_MARKETS_MOCK.filter(market =>
      market.symbol.toLowerCase().includes(trimmed)
    )
  }, [searchText])

  const renderItem: ListRenderItem<PerpetualMarket> = useCallback(
    ({ item, index }) => (
      <PerpetualListItem
        market={item}
        isFirst={index === 0}
        onPress={() => {
          if (router.canGoBack()) {
            router.back()
          }
        }}
      />
    ),
    [router]
  )

  const keyExtractor = useCallback((item: PerpetualMarket) => item.id, [])

  const renderHeader = useCallback(
    () => (
      <SearchBar
        searchText={searchText}
        onTextChanged={setSearchText}
        setSearchBarFocused={setIsSearchBarFocused}
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
          title={`Find perps\nby name or symbol`}
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
      extraData={{ isSearchBarFocused }}
    />
  )
}
