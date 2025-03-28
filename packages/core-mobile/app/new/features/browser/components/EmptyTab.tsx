import {
  FlatList,
  Icons,
  Pressable,
  Text,
  View,
  alpha,
  useTheme
} from '@avalabs/k2-alpine'
// import SearchBar from 'components/SearchBar'
// import { Space } from 'components/Space'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AddHistoryPayload, History } from 'store/browser'
import {
  addHistoryForActiveTab,
  selectAllTabs
} from 'store/browser/slices/tabs'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { useSearchHistory } from 'hooks/browser/useSearchHistory'
import { Dimensions, Platform } from 'react-native'
import { useGoogleSearch } from 'hooks/browser/useGoogleSearch'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isValidHttpUrl, normalizeUrlWithHttps } from '../consts'
import { HistoryListItem } from './HistoryListItem'
import { TabIcon } from './TabIcon'
import { MoreMenu } from './MoreMenu'
import NavButton from './NavButton'
import { FavoritesAndSuggestions } from './FavoritesAndSuggestions'

const SCREEN_WIDTH = Dimensions.get('window').width
const BOTTOM_PADDING = SCREEN_WIDTH * 0.35

type NavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export const EmptyTab = (): JSX.Element => {
  const dispatch = useDispatch()
  const [isFocused, setIsFocused] = useState(false)
  const { navigate } = useNavigation<NavigationProp>()
  const { navigateToGoogleSearchResult } = useGoogleSearch()
  const {
    searchText,
    setSearchText,
    trimmedSearchText,
    filterHistories,
    hasHistory,
    hasSearchResult
  } = useSearchHistory()
  const totalTabs = useSelector(selectAllTabs).length
  const {
    theme: { colors }
  } = useTheme()

  const clearAll = (): void => {
    navigate(AppNavigation.Browser.ClearAllHistory)
  }

  const navigateToTabList = (): void => {
    AnalyticsService.capture('BrowserTabsOpened')
    navigate(AppNavigation.Modal.BrowserTabsList)
  }

  const handleSearchBarSubmit = (): void => {
    AnalyticsService.capture('BrowserSearchSubmitted')

    const normalizedUrl = normalizeUrlWithHttps(trimmedSearchText)
    if (isValidHttpUrl(normalizedUrl)) {
      const history: AddHistoryPayload = {
        title: trimmedSearchText,
        url: normalizedUrl
      }
      dispatch(addHistoryForActiveTab(history))
      navigate(AppNavigation.Browser.TabView)
    } else {
      navigateToGoogleSearchResult(trimmedSearchText)
    }
  }

  const renderHistory = (): JSX.Element => {
    const isSearching = trimmedSearchText.length > 0

    return (
      <View sx={{ flex: 1 }}>
        <Pressable
          onPress={() => {
            AnalyticsService.capture('BrowserSearchSubmitted')
            navigateToGoogleSearchResult(trimmedSearchText)
          }}>
          {(isSearching || trimmedSearchText.length > 0) && (
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
                <Icons.Logos.Google width={24} height={24} />
              </View>
              <Text
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ marginLeft: 16, flex: 1 }}>
                {`Search "${trimmedSearchText}"`}
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
            {/* <Space y={16} /> */}
            <View>
              <FlatList
                keyboardShouldPersistTaps="always"
                keyExtractor={item => (item as History).id}
                data={filterHistories}
                renderItem={item => (
                  <HistoryListItem history={item.item as History} />
                )}
                contentContainerStyle={{ paddingBottom: BOTTOM_PADDING }}
              />
            </View>
          </View>
        )}
      </View>
    )
  }

  return (
    <View
      sx={{
        marginLeft: 16,
        marginRight: 16,
        backgroundColor: '$black',
        flex: 1
      }}>
      <View style={{ flexDirection: 'row' }}>
        {/* <SearchBar
          keyboardType={Platform.OS === 'ios' ? 'web-search' : 'url'}
          setSearchBarFocused={setIsFocused}
          onTextChanged={setSearchText}
          searchText={searchText}
          placeholder="Search or Type URL"
          textColor={colors.$white}
          onSubmitEditing={handleSearchBarSubmit}
          containerStyle={{
            alignItems: 'flex-start'
          }}
          accessoryView={
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                marginRight: -16,
                marginLeft: 8,
                alignItems: 'center'
              }}>
              <TabIcon numberOfTabs={totalTabs} onPress={navigateToTabList} />
              <MoreMenu isFavorited={false}>
                <NavButton
                  Icon={Icons.Navigation.MoreVert}
                  onPress={() => {
                    AnalyticsService.capture('BrowserContextualMenuOpened')
                  }}
                />
              </MoreMenu>
            </View>
          }
        /> */}
      </View>
      {isFocused && renderHistory()}
      {!isFocused && <FavoritesAndSuggestions />}
    </View>
  )
}
