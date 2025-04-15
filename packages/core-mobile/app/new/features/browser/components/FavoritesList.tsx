import { DropdownItem, DropdownMenu } from 'common/components/DropdownMenu'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  TouchableOpacity,
  View
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, Favorite } from 'store/browser'
import { SUGGESTED_ITEMS, SuggestedSiteName } from 'store/browser/const'
import { selectAllFavorites } from 'store/browser/slices/favorites'
import { useBrowserContext } from '../BrowserContext'
import { prepareFaviconToLoad } from '../utils'
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

  const onPress = (item: Favorite): void => {
    AnalyticsService.capture('BrowserFavoritesTapped')
    dispatch(addHistoryForActiveTab({ title: item.title, url: item.url }))
    handleUrlSubmit?.(item.url)
  }

  const renderItem: ListRenderItem<FavoriteOrSuggested> = ({ item }) => {
    if (item.isSuggested) {
      return (
        <View
          style={{
            width: '25%'
          }}>
          <Pressable onPress={() => onPress(item)}>
            <BrowserItem
              type="grid"
              title={item.title.length ? item.title : item.url}
              image={
                item.isSuggested
                  ? getSuggestedImage(item.title)
                  : prepareFaviconToLoad(item.url, item.favicon)
              }
            />
          </Pressable>
        </View>
      )
    }

    return (
      <View
        style={{
          width: '25%'
        }}>
        <FavoriteItem item={item} onPress={onPress} />
      </View>
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

enum MenuId {
  Rename = 'rename',
  Remove = 'remove'
}

const MENU_ITEMS: DropdownItem[] = [
  {
    id: MenuId.Rename,
    title: 'Rename shortcut...'
  },
  {
    id: MenuId.Remove,
    title: 'Remove'
  }
]

const FavoriteItem = ({
  item,
  onPress
}: {
  item: FavoriteOrSuggested
  onPress: (item: Favorite) => void
}): ReactNode => {
  const { handleRenameFavorite, handleRemoveFavorite } = useBrowserContext()
  const [isLongPressActive, setIsLongPressActive] = useState(false)

  const onPressAction = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      switch (nativeEvent.event) {
        case MenuId.Rename:
          handleRenameFavorite(item)
          break
        case MenuId.Remove: {
          handleRemoveFavorite(item)
          break
        }
      }
      setIsLongPressActive(false)
    },
    [handleRenameFavorite, handleRemoveFavorite, item]
  )

  const handlePress = useCallback(() => {
    if (!isLongPressActive) {
      onPress(item)
    }
    setTimeout(() => {
      setIsLongPressActive(false)
    }, 100)
  }, [isLongPressActive, onPress, item])

  const handleLongPress = useCallback(() => {
    setIsLongPressActive(true)
  }, [])

  const handlePressOut = useCallback(() => {
    setTimeout(() => {
      setIsLongPressActive(false)
    }, 100)
  }, [])

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressOut={handlePressOut}
      delayLongPress={200}>
      <DropdownMenu
        groups={[
          {
            id: `favorite-item-${item.id}`,
            items: MENU_ITEMS
          }
        ]}
        disabled={!isLongPressActive}
        onPressAction={onPressAction}
        triggerAction="longPress">
        <BrowserItem
          type="grid"
          title={item.title.length ? item.title : item.url}
          isFavorite
          image={
            item.isSuggested
              ? getSuggestedImage(item.title)
              : prepareFaviconToLoad(item.url, item.favicon)
          }
        />
      </DropdownMenu>
    </TouchableOpacity>
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
