import { Button, SearchBar, showAlert } from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { BrowserItem } from 'features/browser/components/BrowserItem'
import { useSearchHistory } from 'features/browser/hooks/useSearchHistory'
import {
  getSuggestedImage,
  isSuggestedSiteName,
  prepareFaviconToLoad
} from 'features/browser/utils'
import React from 'react'
import { ListRenderItem, Platform } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import {
  addHistoryForActiveTab,
  addTab,
  History,
  selectActiveTab
} from 'store/browser'
import {
  removeAllHistories,
  removeHistory
} from 'store/browser/slices/globalHistory'

const HistoryScreen = (): JSX.Element => {
  const { navigate } = useNavigation()
  const dispatch = useDispatch()
  const tabBarHeight = useBottomTabBarHeight()

  const { searchText, setSearchText, filterHistories, hasHistory } =
    useSearchHistory()

  const activeTab = useSelector(selectActiveTab)

  const handleConfirmClearAll = (): void => {
    dispatch(removeAllHistories())
  }

  const removeAll = (): void => {
    showAlert({
      title: 'Clear your history?',
      description: 'You will permanently delete your historical browsing data',
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: handleConfirmClearAll
        }
      ]
    })
  }

  const handleRemove = (item: History): void => {
    dispatch(removeHistory({ historyId: item.id }))
  }

  const handlePress = (item: History): void => {
    dispatch(addTab())
    if (activeTab) {
      dispatch(addHistoryForActiveTab(item))
      // @ts-ignore TODO: make routes typesafe
      navigate('index')
    }
  }

  const renderItem: ListRenderItem<History> = ({ item, index }) => {
    const image = isSuggestedSiteName(item.title)
      ? getSuggestedImage(item.title)
      : prepareFaviconToLoad(item.url, item.favicon)

    return (
      <BrowserItem
        type="list"
        onRemove={() => handleRemove(item)}
        onPress={() => handlePress(item)}
        title={item.title}
        subtitle={item.url}
        image={image}
        isLast={index === filterHistories.length - 1}
      />
    )
  }

  const renderHeader = (): JSX.Element => {
    return (
      <SearchBar
        onTextChanged={setSearchText}
        searchText={searchText}
        placeholder="Search or Type URL"
        keyboardType={Platform.OS === 'ios' ? 'web-search' : 'url'}
      />
    )
  }

  const renderEmpty = (): JSX.Element => {
    return (
      <ErrorState
        sx={{
          flex: 1
        }}
        title="No Search Results"
        description="Try searching for something else."
      />
    )
  }

  const renderHeaderRight = (): JSX.Element => {
    return (
      <NavigationBarButton>
        {hasHistory && (
          <Button type="secondary" size="small" onPress={removeAll}>
            Clear all
          </Button>
        )}
      </NavigationBarButton>
    )
  }

  if (!hasHistory)
    return (
      <ErrorState
        sx={{
          flex: 1
        }}
        title="You have no History"
        description="Begin browsing to fill this space with pages that you have visited."
      />
    )

  return (
    <ListScreen
      title="History"
      hasTabBar
      data={filterHistories}
      renderItem={renderItem}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
      renderHeaderRight={renderHeaderRight}
      contentContainerStyle={{
        paddingBottom: tabBarHeight + 16
      }}
      keyExtractor={item => (item as History).id}
    />
  )
}

export default HistoryScreen
