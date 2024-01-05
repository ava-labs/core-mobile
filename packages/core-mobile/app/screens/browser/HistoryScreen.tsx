import { FlatList, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import React from 'react'
import { History } from 'store/browser'
import SearchBar from 'components/SearchBar'
import { useSearchHistory } from 'hooks/browser/useSearchHistory'
import { HistoryListItem } from './components/HistoryListItem'
import { NoHistory } from './components/NoHistory'
import { SearchNotFound } from './components/SearchNotFound'

type HistoryNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.History
>['navigation']

export const HistoryScreen = (): JSX.Element => {
  const { navigate } = useNavigation<HistoryNavigationProp>()
  const {
    theme: { colors }
  } = useTheme()
  const {
    searchText,
    setSearchText,
    filterHistories,
    hasHistory,
    hasSearchResult
  } = useSearchHistory()

  const removeAll = (): void => {
    navigate(AppNavigation.Browser.ClearAllHistory)
  }

  const renderHistoryList = (): JSX.Element => {
    return (
      <>
        <SearchBar
          onTextChanged={setSearchText}
          searchText={searchText}
          placeholder="Search or Type URL"
          textColor={colors.$white}
        />
        {hasSearchResult ? (
          <>
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
                  onPress={removeAll}
                  variant="buttonSmall"
                  sx={{ color: '$blueMain' }}>
                  Clear All
                </Text>
              )}
            </View>
            <Space y={16} />
            <FlatList
              keyboardShouldPersistTaps="always"
              keyExtractor={item => (item as History).id}
              data={filterHistories}
              renderItem={item => (
                <HistoryListItem history={item.item as History} />
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </>
        ) : (
          <SearchNotFound />
        )}
      </>
    )
  }

  return (
    <View sx={{ marginHorizontal: 16, flex: 1 }}>
      {hasHistory ? renderHistoryList() : <NoHistory />}
    </View>
  )
}
