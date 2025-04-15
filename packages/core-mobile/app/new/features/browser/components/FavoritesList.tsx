import React, { ReactNode, useMemo } from 'react'
import { FlatList, FlatListProps, ListRenderItem } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, Favorite } from 'store/browser'
import { SUGGESTED_ITEMS } from 'store/browser/const'
import { selectAllFavorites } from 'store/browser/slices/favorites'
import { useBrowserContext } from '../BrowserContext'
import {
  getSuggestedImage,
  isSuggestedSiteName,
  prepareFaviconToLoad
} from '../utils'
import { BrowserItem } from './BrowserItem'

interface FavoriteOrSuggested extends Favorite {
  isSuggested?: boolean
}

export const FavoritesList = (
  props: Partial<FlatListProps<FavoriteOrSuggested>>
): ReactNode => {
  const dispatch = useDispatch()
  const favorites = useSelector(selectAllFavorites)
  const { handleUrlSubmit } = useBrowserContext()

  const onPress = (item: FavoriteOrSuggested): void => {
    if (item.isSuggested) {
      AnalyticsService.capture('BrowserSuggestedTapped')
    } else {
      AnalyticsService.capture('BrowserFavoritesTapped')
    }

    dispatch(addHistoryForActiveTab(item))
    handleUrlSubmit?.(item.url)
  }

  const renderItem: ListRenderItem<FavoriteOrSuggested> = ({ item }) => {
    const image = item.isSuggested
      ? getSuggestedImage(item.title)
      : isSuggestedSiteName(item.title)
      ? getSuggestedImage(item.title)
      : prepareFaviconToLoad(item.url, item.favicon)

    return (
      <BrowserItem
        type="grid"
        title={item.title.length ? item.title : item.url}
        image={image}
        onPress={() => onPress(item)}
        style={{
          width: '25%'
        }}
      />
    )
  }

  const data = useMemo(() => {
    const newFavorites = [...favorites].reverse()

    return [
      ...newFavorites,
      ...SUGGESTED_ITEMS.map(item => ({
        title: item.name,
        url: item.siteUrl,
        isSuggested: true
      }))
    ] as FavoriteOrSuggested[]
  }, [favorites])

  return (
    <FlatList
      {...props}
      data={data}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
      numColumns={4}
    />
  )
}
