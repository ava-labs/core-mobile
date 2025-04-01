import React, { useMemo } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, Favorite } from 'store/browser'
import { SUGGESTED_ITEMS, SuggestedSiteName } from 'store/browser/const'
import { selectAllFavorites } from 'store/browser/slices/favorites'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN, prepareFaviconToLoad } from '../consts'
import { BrowserItem } from './BrowserItem'

interface FavoriteOrSuggested extends Favorite {
  isSuggested?: boolean
}

export const FavoritesList = (): JSX.Element | null => {
  const dispatch = useDispatch()
  const favorites = useSelector(selectAllFavorites)
  const insets = useSafeAreaInsets()
  const { handleUrlSubmit } = useBrowserContext()

  const onPress = (item: Favorite): void => {
    AnalyticsService.capture('BrowserFavoritesTapped')
    dispatch(addHistoryForActiveTab({ title: item.title, url: item.url }))
    handleUrlSubmit?.(item.url)
  }

  const renderItem: ListRenderItem<FavoriteOrSuggested> = ({ item }) => {
    return (
      <BrowserItem
        type="grid"
        title={item.title.length ? item.title : item.url}
        image={
          item.isSuggested
            ? getSuggestedImage(item.title)
            : prepareFaviconToLoad(item.url, item.favicon)
        }
        onPress={() => onPress(item)}
        style={{
          width: '25%'
        }}
      />
    )
  }

  const data = useMemo(() => {
    return [
      ...favorites,
      ...SUGGESTED_ITEMS.map(item => ({
        title: item.name,
        url: item.siteUrl,
        favicon: '/favicon.ico',
        isSuggested: true
      }))
    ] as FavoriteOrSuggested[]
  }, [favorites])

  if (!favorites.length) return null

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      data={data}
      renderItem={renderItem}
      numColumns={4}
      contentContainerStyle={{
        paddingBottom: HORIZONTAL_MARGIN,
        paddingTop: insets.top
      }}
    />
  )
}

function getSuggestedImage(name: string): SuggestedSiteName | undefined {
  switch (name) {
    case SuggestedSiteName.LFJ:
      return require('assets/icons/browser_suggested_icons/traderjoe.png')
    case SuggestedSiteName.YIELD_YAK:
      return require('assets/icons/browser_suggested_icons/yieldyak.png')
    case SuggestedSiteName.GMX:
      return require('assets/icons/browser_suggested_icons/gmx.png')
    case SuggestedSiteName.AAVE:
      return require('assets/icons/browser_suggested_icons/aave.png')
    case SuggestedSiteName.GOGOPOOL:
      return require('assets/icons/browser_suggested_icons/ggp.png')
    case SuggestedSiteName.SALVOR:
      return require('assets/icons/browser_suggested_icons/salvor.png')
    case SuggestedSiteName.DELTA_PRIME:
      return require('assets/icons/browser_suggested_icons/deltaprime.png')
    case SuggestedSiteName.THE_ARENA:
      return require('assets/icons/browser_suggested_icons/arena.png')
    case SuggestedSiteName.STEAKHUT:
      return require('assets/icons/browser_suggested_icons/steakhut.png')
    case SuggestedSiteName.PHARAOH:
      return require('assets/icons/browser_suggested_icons/pharaoh.png')
    case SuggestedSiteName.PANGOLIN:
      return require('assets/icons/browser_suggested_icons/pango.png')
    case SuggestedSiteName.BENQI:
      return require('assets/icons/browser_suggested_icons/benqi.png')
  }
}
