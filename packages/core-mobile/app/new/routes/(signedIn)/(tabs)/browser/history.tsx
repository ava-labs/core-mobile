import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'

import { Button, SearchBar, showAlert, Text, View } from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { ErrorState } from 'common/components/ErrorState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { BrowserItem } from 'features/browser/components/BrowserItem'
import { HORIZONTAL_MARGIN } from 'features/browser/consts'
import { useSearchHistory } from 'features/browser/hooks/useSearchHistory'
import React from 'react'
import { FlatList, ListRenderItem, Platform } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
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
import {
  getSuggestedImage,
  isSuggestedSiteName,
  prepareFaviconToLoad
} from 'features/browser/utils'

const HistoryScreen = (): JSX.Element => {
  const { navigate } = useNavigation()
  const dispatch = useDispatch()

  const {
    searchText,
    setSearchText,
    filterHistories,
    hasHistory,
    hasSearchResult
  } = useSearchHistory()

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
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
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
    <BlurredBarsContentLayout>
      <View
        style={{
          flex: 1,
          marginTop: HORIZONTAL_MARGIN
        }}>
        <View
          style={{
            gap: 14,
            paddingHorizontal: HORIZONTAL_MARGIN
          }}>
          <View
            sx={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            <Text variant="heading2">History</Text>
            {hasHistory && (
              <Button type="secondary" size="small" onPress={removeAll}>
                Clear All
              </Button>
            )}
          </View>
          <SearchBar
            onTextChanged={setSearchText}
            searchText={searchText}
            placeholder="Search or Type URL"
            keyboardType={Platform.OS === 'ios' ? 'web-search' : 'url'}
          />
        </View>

        {hasSearchResult ? (
          <Animated.View
            entering={getListItemEnteringAnimation(0)}
            layout={LinearTransition.springify()}
            style={{
              flex: 1
            }}>
            <FlatList
              keyboardShouldPersistTaps="always"
              keyExtractor={item => (item as History).id}
              data={filterHistories}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingVertical: HORIZONTAL_MARGIN
              }}
            />
          </Animated.View>
        ) : (
          <ErrorState
            sx={{
              flex: 1
            }}
            title="No Search Results"
            description="Try searching for something else."
          />
        )}
      </View>
    </BlurredBarsContentLayout>
  )
}

export default HistoryScreen
