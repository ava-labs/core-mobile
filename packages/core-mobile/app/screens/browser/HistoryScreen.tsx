import { FlatList, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { History } from 'store/browser'
import { selectAllHistories } from 'store/browser/slices/globalHistory'
import SearchBar from 'components/SearchBar'
import { HistoryListItem } from './components/HistoryListItem'

type HistoryNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.History
>['navigation']

export const HistoryScreen = (): JSX.Element => {
  const histories = useSelector(selectAllHistories)
  const hasHistory = histories.length > 0
  const { navigate } = useNavigation<HistoryNavigationProp>()
  const [searchText, setSearchText] = useState('')
  const [filterHistories, setFilterHistories] = useState(histories)
  const {
    theme: { colors }
  } = useTheme()

  const removeAll = (): void => {
    navigate(AppNavigation.Browser.AreYouSure)
  }

  useEffect(() => {
    if (searchText.length > 0 && histories.length > 0) {
      const filteredHistories = histories.filter(history => {
        return history.title.toLowerCase().includes(searchText.toLowerCase())
      })
      setFilterHistories(filteredHistories)
      return
    }
    setFilterHistories(histories)
  }, [histories, searchText])

  return (
    <View sx={{ marginHorizontal: 16, flex: 1 }}>
      <SearchBar
        onTextChanged={setSearchText}
        searchText={searchText}
        placeholder="Search or Type URL"
        textColor={colors.$white}
      />
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
        data={filterHistories}
        renderItem={item => <HistoryListItem history={item.item as History} />}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  )
}
