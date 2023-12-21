import {
  FlatList,
  Pressable,
  Text,
  View,
  alpha,
  useTheme
} from '@avalabs/k2-mobile'
import SearchBar from 'components/SearchBar'
import { Space } from 'components/Space'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AddHistoryPayload, History } from 'store/browser'
import GoogleSVG from 'assets/icons/google.svg'
import { addHistoryForActiveTab } from 'store/browser/slices/tabs'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import useScrollHandler, { ScrollState } from 'hooks/browser/useScrollHandler'
import { useSearchHistory } from 'hooks/browser/useSearchHistory'
import { FavoritesAndSuggestions } from './FavoritesAndSuggestions'
import { HistoryListItem } from './HistoryListItem'

type NavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export const EmptyTab = ({
  onNewScrollState
}: {
  onNewScrollState: (scrollState: ScrollState) => void
}): JSX.Element => {
  const dispatch = useDispatch()
  const [isFocused, setIsFocused] = useState(false)
  const { navigate } = useNavigation<NavigationProp>()
  const { scrollState, onScrollHandler } = useScrollHandler()
  const {
    searchText,
    setSearchText,
    filterHistories,
    hasHistory,
    hasSearchResult
  } = useSearchHistory()

  const {
    theme: { colors }
  } = useTheme()

  useEffect(() => {
    onNewScrollState(scrollState)
  }, [onNewScrollState, scrollState])

  const clearAll = (): void => {
    navigate(AppNavigation.Browser.ClearAllHistory)
  }

  const handleGoogleSearch = (): void => {
    const url =
      'https://www.google.com/search?q=' + encodeURIComponent(searchText)
    const history: AddHistoryPayload = {
      title: searchText,
      url
    }
    dispatch(addHistoryForActiveTab(history))
    navigate(AppNavigation.Browser.TabView)
  }

  const renderHistory = (): JSX.Element => {
    const isSearching = searchText.length > 0

    return (
      <View>
        <Pressable onPress={handleGoogleSearch}>
          {(isSearching || searchText.length > 0) && (
            <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: alpha(colors.$neutral700, 0.4),
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row'
                }}>
                <GoogleSVG width={24} height={24} />
              </View>
              <Text
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ marginLeft: 16, flex: 1 }}>
                {`Search "${searchText}"`}
              </Text>
            </View>
          )}
        </Pressable>
        {hasSearchResult && (
          <View>
            <View
              sx={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16
              }}>
              <Text variant="heading5">History</Text>
              {hasHistory && (
                <Text
                  onPress={clearAll}
                  variant="buttonSmall"
                  sx={{ color: '$blueMain' }}>
                  Clear All
                </Text>
              )}
            </View>
            <Space y={16} />
            <FlatList
              data={filterHistories}
              onScroll={onScrollHandler}
              renderItem={item => (
                <HistoryListItem history={item.item as History} />
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
              sx={{ height: '85%' }}
            />
          </View>
        )}
      </View>
    )
  }

  return (
    <View sx={{ paddingHorizontal: 16, backgroundColor: '$black' }}>
      <SearchBar
        setSearchBarFocused={setIsFocused}
        onTextChanged={setSearchText}
        searchText={searchText}
        placeholder="Search or Type URL"
        textColor={colors.$white}
      />
      {isFocused && renderHistory()}
      {!isFocused && (
        <FavoritesAndSuggestions onScrollHandler={onScrollHandler} />
      )}
    </View>
  )
}
